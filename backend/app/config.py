import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "AI Resume & Job Match Analyzer"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "resume_matcher_db")
    MAX_UPLOAD_SIZE_MB: int = 10
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
