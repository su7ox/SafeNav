from motor.motor_asyncio import AsyncIOMotorClient
import os

# Default to local Mongo, or use env variable
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
CLIENT = AsyncIOMotorClient(MONGO_URL)
DB = CLIENT.safenav_db  # Database name

async def get_database():
    return DB