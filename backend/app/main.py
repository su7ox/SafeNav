from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.endpoints import router as api_router
from app.core.database import engine, Base
from app.core.models import User, ScanHistory 
from app.core.trust_manager import trust_manager
from app.utils.feed_syncer import sync_top_domains_feed
import threading
import time

# --- BACKGROUND CRON TASK ---
def weekly_cron_job():
    """Background thread running infinitely to refresh data every 7 days."""
    while True:
        time.sleep(7 * 24 * 60 * 60)  # Wait 7 days
        try:
            print("[Cron] Starting weekly sync of enterprise top domains list...")
            sync_top_domains_feed()
            trust_manager.load_cache()
        except Exception as e:
            print(f"❌ [Cron] Sync error: {e}")

# --- LIFECYCLE MANAGEMENT ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ------------------ STARTUP EVENTS ------------------
    # 1. Initialize PostgreSQL Database tables
    try:
        async with engine.begin() as conn:
            # Note: In production, use a migration tool like Alembic instead of create_all
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Connected to PostgreSQL and verified tables successfully!")
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")

    # 2. Load top domains list into memory cache
    try:
        trust_manager.load_cache()
    except Exception as e:
        print(f"❌ Failed to load trust manager data: {e}")

    # 3. Fire up background feed update daemon thread
    cron = threading.Thread(target=weekly_cron_job, daemon=True)
    cron.start()
    print("🚀 Background feed syncer worker started successfully!")

    yield  # FastAPI running state occurs here

    # ------------------ SHUTDOWN EVENTS ------------------
    await engine.dispose()
    print("🛑 Disconnected from PostgreSQL safely.")


# --- FASTAPI APP DEFNITION ---
app = FastAPI(title="SafeNav API", version="1.0", lifespan=lifespan)

# --- CORS SETTINGS ---
origins = [
    "http://localhost:5173", 
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


@app.get("/")
def read_root():
    return {"message": "SafeNav Backend is Running (PostgreSQL & Enterprise Trust Feed enabled)"}