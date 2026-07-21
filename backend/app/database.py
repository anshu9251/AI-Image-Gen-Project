from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger("uvicorn.error")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

def get_database():
    return db.db

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.mongo_uri)
        # Parses default database from connection string, fallback to "ai_image_gen"
        db.db = db.client.get_default_database(default="ai_image_gen")
        logger.info("Connected to MongoDB successfully!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed.")
