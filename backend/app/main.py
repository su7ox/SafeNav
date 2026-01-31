from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.core.database import CLIENT

app = FastAPI(title="SafeNav API", version="1.0")

# --- CORS SETTINGS (This fixes the connection error) ---
origins = [
    "http://localhost:5173",  # React Frontend
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INCLUDE ROUTES ---
app.include_router(api_router, prefix="/api/v1")

# --- DATABASE EVENTS ---
@app.on_event("startup")
async def startup_db_client():
    # Verify DB connection on start
    try:
        await CLIENT.server_info()
        print("✅ Connected to MongoDB successfully!")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    CLIENT.close()

@app.get("/")
def read_root():
    return {"message": "SafeNav Backend is Running"}