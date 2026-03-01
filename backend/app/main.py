from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.core.database import engine, Base
# Import models so SQLAlchemy knows they exist before creating tables
from app.core.models import User, ScanHistory 

app = FastAPI(title="SafeNav API", version="1.0")

# --- CORS SETTINGS ---
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
    # This will create your tables in PostgreSQL if they don't exist yet
    try:
        async with engine.begin() as conn:
            # Note: In production, you would use a migration tool like Alembic instead of create_all
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Connected to PostgreSQL and verified tables successfully!")
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    await engine.dispose()
    print("🛑 Disconnected from PostgreSQL.")

@app.get("/")
def read_root():
    return {"message": "SafeNav Backend is Running (PostgreSQL enabled)"}