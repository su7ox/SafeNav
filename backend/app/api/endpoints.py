import socket
import ipaddress
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from urllib.parse import urlparse
from datetime import datetime

# --- SQLALCHEMY IMPORTS ---
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.core.database import get_db
from app.core.models import User, ScanHistory, ScanResponseSchema # (Make sure you imported your schemas)

from app.core.security import verify_password, get_password_hash, create_access_token

# Import Analysis Modules
from app.core.normalization import normalize_url
from app.core.fingerprinting import identify_link_type
from app.core.tracing import trace_redirects
from app.core.ssl_check import inspect_ssl
from app.core.reputation import check_domain_reputation
from app.core.lexical import check_lexical_risk
from app.core.content_scan import inspect_content
from app.core.ip_intel import check_ip_intel

# --- NEW SCORING ENGINE IMPORT ---
from app.utils.scoring import calculate_risk_score

router = APIRouter()

# Guests allowed (auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login", auto_error=False)

# --- MODELS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class ScanRequest(BaseModel):
    url: str

# --- AUTH HELPER ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    from app.core.security import SECRET_KEY, ALGORITHM
    from jose import jwt, JWTError
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # SQLAlchemy Query replacing MongoDB's find_one
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- SSRF PROTECTION ---
def validate_target_ip(hostname):
    try:
        ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip)
        if ip_obj.is_private or ip_obj.is_loopback:
            raise HTTPException(status_code=400, detail="Scanning internal IPs is prohibited.")
        return True
    except socket.gaierror:
        pass 
    except ValueError:
        pass
    return True

# --- ROUTES ---

@router.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user.password)
    
    # Create new user model and save it
    new_user = User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    await db.commit()
    
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    # Verify password against the hashed password on the model
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/scan")
async def analyze_url(
    request: ScanRequest, 
    user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        normalized_url, hostname, norm_flags = normalize_url(request.url)
        validate_target_ip(hostname) # SSRF Check

        # Data Gathering (Synchronous)
        fingerprint = identify_link_type(normalized_url, hostname)
        trace = trace_redirects(normalized_url)
        ssl_data = inspect_ssl(hostname)
        lexical = check_lexical_risk(normalized_url, hostname)
        content_data = inspect_content(trace.get("html_content"), normalized_url)
        
        # Data Gathering (Asynchronous, Parallel)
        reputation, ip_intel = await asyncio.gather(
            check_domain_reputation(normalized_url),
            check_ip_intel(normalized_url)
        )
        
    except socket.gaierror:
        return {
            "url": request.url,
            "risk_score": 0,
            "risk_level": "Unreachable",
            "details": {"error": "Domain does not exist"},
            "scan_time": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Scan Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # --- CALCULATE FLAGS FOR DETAILS ---
    
    # 1. Phishing
    is_typosquat = lexical.get("is_typosquat", False)
    brand_detected = lexical.get("target", "None") if is_typosquat else "None"
    suspicious_kw = any(x in normalized_url for x in ["login", "verify", "update", "secure", "bank"])
    is_homograph = "xn--" in hostname 

    # 2. Reputation
    dom_age = reputation.get("domain_age_days")
    if dom_age is None:
        dom_status = "Unknown"
        dom_age_display = "Unknown"
    else:
        dom_status = "New (< 30 Days)" if dom_age < 30 else "Established"
        dom_age_display = f"{dom_age} days"
        
    is_sus_tld = reputation.get("is_suspicious_tld", False)
    whois_privacy = True 

    # 3. Link Structure
    link_cat = "Standard"
    if fingerprint.get("is_shortened"): link_cat = "Shortened"
    elif fingerprint.get("is_ip_based"): link_cat = "IP Address"
    elif fingerprint.get("is_download"): link_cat = "File/App"
    
    tags = fingerprint.get("tags", [])
    service_type = tags[0].title() if tags else "General Website"
    short_provider = fingerprint.get("provider")
    short_provider = short_provider.title() if short_provider else "None"
    is_obfuscated = "%" in request.url or "0x" in request.url

    # 4. Redirects
    hops = trace.get("hop_count", 0)
    parsed_start = urlparse(normalized_url)
    parsed_end = urlparse(trace.get("final_url", ""))
    start_domain = parsed_start.netloc
    end_domain = parsed_end.netloc
    cross_domain = start_domain != end_domain
    
    # --- NEW SCORING ENGINE INTEGRATION ---
    
    combined_scan_data = {
        "url": normalized_url,
        "has_ip_in_domain": fingerprint.get("is_ip_based", False),
        "url_length": len(normalized_url),
        "num_subdomains": len(hostname.split('.')) - 2 if len(hostname.split('.')) > 2 else 0,
        "tld": f".{hostname.split('.')[-1]}" if "." in hostname else "",
        
        "ssl": ssl_data,
        "ip_intel": ip_intel,
        
        "is_blacklisted": reputation.get("is_blacklisted", False),
        "domain_age_days": reputation.get("domain_age_days", 999),
        "has_obfuscated_scripts": content_data.get("has_obfuscated_scripts", is_obfuscated),
        **lexical,
        **content_data
    }

    # Execute the strict ruleset
    risk_assessment = calculate_risk_score(combined_scan_data)
    
    # --- CONSTRUCT DETAILS ---
    details = {
        "ssl_security": ssl_data, 

        "ip_intelligence": {
            "ip_address": ip_intel.get("ip_address", "Unknown"),
            "hosting_country": f"{ip_intel.get('hosting_country', 'Unknown')} {ip_intel.get('hosting_flag', '') or ''}".strip(),
            "isp": ip_intel.get("isp", "Unknown"),
            "asn_org": ip_intel.get("asn_org", "Unknown"),
            "is_vpn_or_proxy": "Yes" if ip_intel.get("is_vpn_or_proxy") else "No",
            "registrant_country": f"{ip_intel.get('registrant_country', 'Unknown')} {ip_intel.get('registrant_flag', '') or ''}".strip(),
            "country_mismatch": "Yes" if ip_intel.get("country_mismatch") else "No",
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
            "is_ip_based": "Yes" if fingerprint.get("is_ip_based") else "No",
            "obfuscation": "Yes" if is_obfuscated else "No"
        },
        "redirect_analysis": {
            "hop_count": hops,
            "cross_domain": "Yes" if cross_domain else "No",
            "final_destination": trace.get("final_url", normalized_url),
            "redirect_loop": "No"
        }
    }

    # --- SAVE TO DB ---
    scan_time = datetime.utcnow()
    
    # Check if there is an SSL issue for quick database filtering
    has_ssl_issue = not ssl_data.get("is_valid", True) or len(ssl_data.get("warning_flags", [])) > 0
    
    # Create the SQLAlchemy model instance
    new_scan = ScanHistory(
        url=normalized_url,
        risk_score=risk_assessment["final_score"],
        risk_level=risk_assessment["risk_level"], # Updated from 'verdict'
        has_ssl_issue=has_ssl_issue,              # New column from models.py
        details=details,
        reasoning=risk_assessment["risk_factors"], 
        scan_time=scan_time,
        user_email=user.email,
        is_guest=False
    )
    
    db.add(new_scan)
    await db.commit()
    await db.refresh(new_scan) 

    # --- RESPOND ---
    return {
        "id": str(new_scan.id),
        "url": normalized_url,
        "risk_score": risk_assessment["final_score"],
        "risk_level": risk_assessment["risk_level"], # Updated from 'verdict'
        "details": details,
        "category_breakdown": risk_assessment["category_breakdown"], # Unpacked for React charts
        "risk_factors": risk_assessment["risk_factors"],
        "ssl_details": ssl_data, # Top-level exposure for the React Frontend
        "scan_time": scan_time.isoformat(),
        "user_email": user.email,
        "is_guest": False
    }

@router.post("/deep-scan")
async def deep_scan(request: ScanRequest, user: User = Depends(get_current_user)):
    return {
        "status": "Deep Scan Initiated",
        "user": user.email, 
        "message": "Dynamic sandbox analysis started (Phase 2 feature)"
    }

@router.get("/history")
async def get_scan_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Fetch the last 20 scans for the logged-in user.
    """
    try:
        # SQLAlchemy query with sorting and limiting
        query = (
            select(ScanHistory)
            .where(ScanHistory.user_email == user.email)
            .order_by(desc(ScanHistory.scan_time))
            .limit(20)
        )
        
        result = await db.execute(query)
        history = result.scalars().all()

        # Format for JSON response
        cleaned_history = []
        for item in history:
            cleaned_history.append({
                "id": str(item.id),
                "url": item.url,
                "risk_score": item.risk_score,
                "risk_level": item.risk_level, # Updated from 'verdict'
                "has_ssl_issue": item.has_ssl_issue, # Added the new flag
                "details": item.details,
                "reasoning": item.reasoning,
                "scan_time": item.scan_time.isoformat(),
                "user_email": item.user_email
            })
            
        return cleaned_history
    except Exception as e:
        print(f"History Error: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch history")