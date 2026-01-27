from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(title="SafeNav Phase 1: Static Analysis Engine")

# Configure CORS for React integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the scanning routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "SafeNav Static Analysis Engine is Operational"}