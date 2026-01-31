from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.core.database import DB
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.ml_engine import MLEngine  # Assuming your existing logic
# Import your other existing logic (fingerprinting, etc.) here

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")

# --- MODELS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
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
    # ... (Your existing scanning logic here) ...
    # Placeholder results for demo:
    risk_score = 45
    verdict = "Suspicious"
    reasoning = ["High entropy detected", "Redirect chain obfuscation"]
    details = {"cert_age_days": 12, "hop_count": 3}

    # LOGIC GATE
    if not user:
        # Hide advanced AI data for guests
        return {
            "url": request.url,
            "risk_score": risk_score,
            "verdict": verdict,
            "reasoning": ["🔒 Login to view AI Security Analysis"],
            "details": details,
            "is_guest": True
        }
    
    # Return full data for users
    return {
        "url": request.url,
        "risk_score": risk_score,
        "verdict": verdict,
        "reasoning": reasoning,
        "details": details,
        "is_guest": False
    }

@router.post("/deep-scan")
async def deep_scan(request: ScanRequest, user: dict = Depends(get_current_user)):
    """
    Deep Scan: strict access for logged-in users only.
    """
    # This would trigger your Selenium/Sandboxing logic
    return {
        "status": "Deep Scan Initiated",
        "user": user["email"],
        "estimated_time": "2 minutes"
    }