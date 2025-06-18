from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "StoryForge API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-powered creative writing sandbox"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"
    
    # AI Services
    GROK_API_KEY: Optional[str] = os.getenv("GROK_API_KEY")  # Required in production
    OPENAI_API_KEY: Optional[str] = None  # Fallback
    AI_MODEL: str = "llama-3.3-70b-versatile"
    MAX_TOKENS: int = 1500
    TEMPERATURE: float = 0.8
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL_SECONDS: int = 3600  # 1 hour
    
    # Rate Limiting
    RATE_LIMIT_FREE_TIER: int = 10  # requests per hour
    RATE_LIMIT_PRO_TIER: int = 1000  # requests per hour
    DAILY_ANALYSIS_LIMIT_FREE: int = 1
    DAILY_ANALYSIS_LIMIT_PRO: int = 50
    
    # Database (if needed later)
    DATABASE_URL: Optional[str] = None
    
    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "https://storyforge.vercel.app"
    ]
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".txt", ".md", ".docx"}
    
    # Export Settings
    EXPORT_DIR: str = "exports"
    EXPORT_TTL_HOURS: int = 24
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Analytics
    ANALYTICS_ENABLED: bool = True
    SENTRY_DSN: Optional[str] = None
    
    # Subscription Tiers
    FREE_TIER_FEATURES: list = ["basic_generation", "limited_analysis"]
    PRO_TIER_FEATURES: list = ["unlimited_generation", "full_analysis", "export", "priority_support"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Ensure required directories exist
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.EXPORT_DIR, exist_ok=True)
        
        # Validate critical settings in production
        if self.ENVIRONMENT == "production":
            if not self.GROK_API_KEY:
                raise ValueError("GROK_API_KEY is required in production")
            if self.SECRET_KEY == "your-super-secret-key-change-in-production":
                raise ValueError("SECRET_KEY must be changed in production")
            self.DEBUG = False

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property 
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    def get_cors_origins(self) -> list:
        """Get CORS origins based on environment"""
        if self.is_development:
            return self.BACKEND_CORS_ORIGINS + ["http://localhost:8000"]
        return self.BACKEND_CORS_ORIGINS

# Global settings instance
settings = Settings()