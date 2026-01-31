from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.core.database import DB
from app.core.security import verify_password, get_password_hash, create_access_token

# --- CORRECT IMPORTS FOR YOUR SCANNING ENGINE ---
from app.core.normalization import normalize_url
from app.core.fingerprinting import identify_link_type
from app.core.tracing import trace_redirects
from app.core.ssl_check import inspect_ssl
from app.core.reputation import check_domain_reputation
from app.core.lexical import check_lexical_risk
from app.core.ml_engine import predict_risk  # <--- THIS IS THE FIX
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
    """
    Standard Scan:
    - Guests: See Score + Verdict (Reasoning is masked).
    - Logged In: See Score + Verdict + FULL AI Reasoning.
    """
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")

    # 1. Normalization & Initial ID
    normalized_url, hostname = normalize_url(request.url)
    fingerprint = identify_link_type(normalized_url, hostname)
    
    # 2. Network & Crypto Analysis
    trace = await trace_redirects(normalized_url)
    ssl_data = inspect_ssl(hostname)
    reputation = check_domain_reputation(normalized_url)
    
    # 3. Textual & Statistical Analysis
    lexical = check_lexical_risk(normalized_url, hostname)
    
    # 4. Content & ML Analysis
    # content_scan uses HTML retrieved during redirect trace
    content_data = inspect_content(trace.get("html_content"), normalized_url)
    
    # Run ML Prediction (Using the correct function)
    ml_result = predict_risk(normalized_url, hostname, lexical, reputation)

    # 5. Risk Score Aggregation
    all_warnings = (
        fingerprint["tags"] + trace["warning_flags"] + 
        ssl_data["warning_flags"] + reputation["warning_flags"] + 
        lexical["warning_flags"] + content_data["warning_flags"]
    )
    
    # Fusion Algorithm
    final_score = calculate_fusion_score(ml_result["ml_probability"], all_warnings)

    # 6. Verdict Logic
    verdict = "Safe" if final_score <= 30 else "Caution" if final_score <= 69 else "High Risk"

    details = {
        "ml_probability": ml_result["ml_probability"],
        "hop_count": trace["hop_count"],
        "cert_age": ssl_data["cert_age_days"]
    }

    # LOGIC GATE: Hide reasoning if user is not logged in
    if not user:
        return {
            "url": normalized_url,
            "final_destination": trace["final_url"],
            "risk_score": final_score,
            "verdict": verdict,
            "details": details,
            "reasoning": ["🔒 Login to view AI Security Analysis"],
            "is_guest": True
        }
    
    # Return full data for logged-in users
    return {
        "url": normalized_url,
        "final_destination": trace["final_url"],
        "risk_score": final_score,
        "verdict": verdict,
        "details": details,
        "reasoning": list(set(all_warnings)),
        "is_guest": False
    }

@router.post("/deep-scan")
async def deep_scan(request: ScanRequest, user: dict = Depends(get_current_user)):
    """
    Deep Scan: Strict access for logged-in users only.
    """
    return {
        "status": "Deep Scan Initiated",
        "user": user["email"],
        "estimated_time": "2 minutes",
        "message": "Dynamic sandbox analysis started (Phase 2 feature)"
    }