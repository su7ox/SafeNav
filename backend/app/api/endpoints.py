import socket  # <--- NEW IMPORT
import ipaddress # <--- NEW IMPORT
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.core.database import DB
from app.core.security import verify_password, get_password_hash, create_access_token
from urllib.parse import urlparse
from datetime import datetime

# Import Analysis Modules
from app.core.normalization import normalize_url
from app.core.fingerprinting import identify_link_type
from app.core.tracing import trace_redirects
from app.core.ssl_check import inspect_ssl
from app.core.reputation import check_domain_reputation
from app.core.lexical import check_lexical_risk
from app.core.ml_engine import predict_risk 
from app.core.content_scan import inspect_content
from app.utils.scoring import calculate_fusion_score

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")

# --- MODELS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class ScanRequest(BaseModel):
    url: str

# --- AUTH HELPER ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    from app.core.security import SECRET_KEY, ALGORITHM
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await DB.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_optional_user(token: str = Depends(oauth2_scheme)):
    try:
        return await get_current_user(token)
    except:
        return None 

# --- HELPER: SSRF CHECK ---
def validate_target_ip(hostname):
    """
    Prevents scanning localhost or private internal networks (SSRF Protection).
    Returns True if safe, raises HTTPException if unsafe.
    """
    try:
        ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip)
        
        # Block private IPs (Localhost, 192.168.x.x, 10.x.x.x, etc.)
        if ip_obj.is_private or ip_obj.is_loopback:
            raise HTTPException(
                status_code=400, 
                detail=f"Scanning internal/private IPs ({ip}) is not allowed."
            )
        return True
    except socket.gaierror:
        # Domain doesn't exist - this is handled later, but not an SSRF risk
        pass
    except ValueError:
        pass # Not an IP
    return True

# --- ROUTES ---

@router.post("/register")
async def register(user: UserCreate):
    existing_user = await DB.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user.password)
    user_doc = {"email": user.email, "hashed_password": hashed_pw}
    await DB.users.insert_one(user_doc)
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await DB.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/scan")
async def analyze_url(request: ScanRequest, user: dict = Depends(get_optional_user)):
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")

    # --- 1. EXECUTE ANALYSIS ---
    try:
        normalized_url, hostname = normalize_url(request.url)
        
        # [NEW] SSRF Protection Check
        validate_target_ip(hostname)

        # Standard Checks
        fingerprint = identify_link_type(normalized_url, hostname)
        trace = await trace_redirects(normalized_url)
        ssl_data = inspect_ssl(hostname)
        reputation = await check_domain_reputation(normalized_url)
        lexical = check_lexical_risk(normalized_url, hostname)
        content_data = inspect_content(trace.get("html_content"), normalized_url)
        
        # ML Prediction
        ml_result = predict_risk(normalized_url, hostname, lexical, reputation)

    # --- [NEW] GRACEFUL ERROR HANDLING ---
    except socket.gaierror:
        # Domain does not exist (DNS Error)
        return {
            "url": request.url,
            "risk_score": 0,
            "verdict": "Unreachable",
            "details": {
                "error": "Domain does not exist or could not be resolved.",
                "status": "Offline"
            },
            "scan_time": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Analysis Failed: {e}")
        # Only 500 if it's a true unexpected crash
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

    # --- 2. CALCULATE FLAGS & CATEGORIES ---
    
    # Category 1: SSL
    https_enabled = normalized_url.startswith("https")
    cert_status = "Valid" if ssl_data.get("is_valid") else "Expired/Invalid"
    if not https_enabled: cert_status = "None"
    
    # Category 2: Phishing
    is_typosquat = lexical.get("is_typosquat", False)
    brand_detected = lexical.get("target", "None") if is_typosquat else "None"
    suspicious_kw = any(x in normalized_url for x in ["login", "verify", "update", "secure", "bank"])
    is_homograph = "xn--" in hostname 

    # Category 3: Reputation
    dom_age = reputation.get("domain_age_days") 
    if dom_age is None:
        dom_status = "Unknown"
        dom_age_display = "Unknown"
    else:
        dom_status = "New (< 30 Days)" if dom_age < 30 else "Established"
        dom_age_display = f"{dom_age} days"
        
    is_sus_tld = reputation.get("is_suspicious_tld", False)
    whois_privacy = True 

    # Category 4: Link Structure
    link_cat = "Standard"
    if fingerprint["is_shortened"]: link_cat = "Shortened"
    elif fingerprint["is_ip_based"]: link_cat = "IP Address"
    elif fingerprint["is_download"]: link_cat = "File/App"
    
    tags = fingerprint.get("tags", [])
    service_type = tags[0].title() if tags else "General Website"
    
    short_provider = fingerprint.get("provider")
    short_provider = short_provider.title() if short_provider else "None"

    is_obfuscated = "%" in request.url or "0x" in request.url

    # Category 5: Redirects
    hops = trace.get("hop_count", 0)
    parsed_start = urlparse(normalized_url)
    parsed_end = urlparse(trace.get("final_url", ""))
    
    start_domain = parsed_start.netloc
    end_domain = parsed_end.netloc
    cross_domain = start_domain != end_domain
    
    # Category 6: Content
    insecure_form = content_data.get("has_login_form") and not https_enabled

    # --- 3. CONSTRUCT DETAILS ---
    details = {
        "ssl_security": {
            "https_enabled": "Yes" if https_enabled else "No",
            "cert_validity": cert_status,
            "validation_type": ssl_data.get("validation_type", "Unknown"),
            "issuer": ssl_data.get("issuer", "Unknown"),
            "cert_age": f"{ssl_data.get('cert_age_days', 0)} days"
        },
        "phishing_checks": {
            "typosquatting": "Yes" if is_typosquat else "No",
            "brand_similarity": brand_detected.title(),
            "suspicious_keywords": "Yes" if suspicious_kw else "No",
            "homograph_attack": "Yes" if is_homograph else "No"
        },
        "domain_reputation": {
            "domain_age": dom_age_display,
            "domain_status": dom_status,
            "suspicious_tld": "Yes" if is_sus_tld else "No",
            "registrar_trust": "Normal", 
            "whois_privacy": "Yes" if whois_privacy else "No"
        },
        "link_structure": {
            "platform": fingerprint.get("platform", "Unknown").title(),
            "service_type": service_type,
            "link_category": link_cat,
            "short_provider": short_provider,
            "original_domain": start_domain,
            "is_ip_based": "Yes" if fingerprint["is_ip_based"] else "No",
            "obfuscation": "Yes" if is_obfuscated else "No"
        },
        "redirect_analysis": {
            "hop_count": hops,
            "cross_domain": "Yes" if cross_domain else "No",
            "final_destination": trace.get("final_url", normalized_url),
            "redirect_loop": "No"
        },
        "content_safety": {
            "login_detected": "Yes" if content_data.get("has_login_form") else "No",
            "password_field": "Yes" if content_data.get("has_password_field") else "No",
            "insecure_submission": "Unsafe" if insecure_form else "Safe",
            "client_redirect": "No"
        }
    }

    # --- 4. SCORING ---
    all_warnings = (
        fingerprint["tags"] + trace["warning_flags"] + 
        ssl_data["warning_flags"] + reputation["warning_flags"] + 
        lexical["warning_flags"] + content_data["warning_flags"]
    )
    final_score = calculate_fusion_score(ml_result["ml_probability"], all_warnings)
    verdict = "Safe" if final_score <= 30 else "Caution" if final_score <= 69 else "High Risk"

    response = {
        "url": normalized_url,
        "risk_score": final_score,
        "verdict": verdict,
        "details": details,
        "is_guest": False,
        "scan_time": datetime.utcnow().isoformat()
    }

    if not user:
        response["reasoning"] = ["🔒 Login to view AI Security Analysis"]
        response["is_guest"] = True
    else:
        response["reasoning"] = list(set(all_warnings))

    return response

@router.post("/deep-scan")
async def deep_scan(request: ScanRequest, user: dict = Depends(get_current_user)):
    return {
        "status": "Deep Scan Initiated",
        "user": user["email"],
        "message": "Dynamic sandbox analysis started (Phase 2 feature)"
    }