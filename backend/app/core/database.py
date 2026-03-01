import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Use the environment variable we set in docker-compose, or a local default
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://safenav_user:safenav_password@localhost:5432/safenav_db"
)

# Create the async SQLAlchemy engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True if you want to see the generated SQL queries in the console
    future=True
)

# Create a session factory for our async sessions
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for all our SQLAlchemy ORM models
Base = declarative_base()

# Dependency to get the database session in FastAPI endpoints
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()