from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.core.database import DB
from app.core.security import verify_password, get_password_hash, create_access_token

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
        return None  # Allow guest access

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

    # 1. Run All Analysis Modules
    normalized_url, hostname = normalize_url(request.url)
    fingerprint = identify_link_type(normalized_url, hostname)
    trace = await trace_redirects(normalized_url)
    ssl_data = inspect_ssl(hostname)
    reputation = check_domain_reputation(normalized_url)
    lexical = check_lexical_risk(normalized_url, hostname)
    content_data = inspect_content(trace.get("html_content"), normalized_url)
    
    # 2. ML Prediction
    ml_result = predict_risk(normalized_url, hostname, lexical, reputation)

    # 3. Aggregate Warnings
    all_warnings = (
        fingerprint["tags"] + trace["warning_flags"] + 
        ssl_data["warning_flags"] + reputation["warning_flags"] + 
        lexical["warning_flags"] + content_data["warning_flags"]
    )
    
    final_score = calculate_fusion_score(ml_result["ml_probability"], all_warnings)
    verdict = "Safe" if final_score <= 30 else "Caution" if final_score <= 69 else "High Risk"

    # 4. Prepare Rich Details (According to Report Page 12-13)
    # We explicitly verify flags here so they are visible to guests in the UI
    has_suspicious_tld = any("TLD" in w for w in all_warnings)
    has_typosquatting = any("Typosquatting" in w for w in all_warnings)
    [cite_start]has_insecure_login = any("Insecure Login" in w for w in all_warnings) # [cite: 912]

    # Determine Link Category (Shortener, IP, Standard)
    link_category = "Standard URL"
    [cite_start]if fingerprint["is_shortened"]: link_category = "Shortened URL" # [cite: 722]
    [cite_start]elif fingerprint["is_ip_based"]: link_category = "IP-Based URL" # [cite: 1085]
    [cite_start]elif fingerprint["is_download"]: link_category = "File Download" # [cite: 728]

    details = {
        # Threat Indicators
        "suspicious_tld": has_suspicious_tld,
        "typosquatting": has_typosquatting,
        "insecure_login": has_insecure_login,
        "hop_count": trace["hop_count"],
        
        # Technical Footprint
        "link_category": link_category,
        "cert_age_days": ssl_data["cert_age_days"],
        [cite_start]"ssl_issuer": ssl_data["issuer"],        # [cite: 156]
        [cite_start]"ssl_type": ssl_data["validation_type"], # [cite: 154] (DV vs OV)
        "final_destination": trace["final_url"]
    }

    response = {
        "url": normalized_url,
        "risk_score": final_score,
        "verdict": verdict,
        "details": details,
        "is_guest": False
    }

    # Hide specific AI reasoning text for guests, but show the details above
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
        "estimated_time": "2 minutes",
        "message": "Dynamic sandbox analysis started (Phase 2 feature)"
    }