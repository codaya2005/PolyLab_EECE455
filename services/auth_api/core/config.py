from typing import List, Optional

from pydantic import EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App / URLs ---
    APP_NAME: str = "auth-api"
    DEBUG: bool = True
    BACKEND_BASE_URL: str = "http://127.0.0.1:8000"

    # --- Security / Session ---
    SECRET_KEY: str = "change-me-in-prod"
    SESSION_COOKIE_NAME: str = "session_id"
    SESSION_TTL_MINUTES: int = 120
    CSRF_COOKIE_NAME: str = "csrf_token"

    # --- Database ---
    DATABASE_URL: str = "sqlite:///./auth.db"

    # --- CORS / Frontend ---
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    HSTS_ENABLED: bool = False
    RATE_LIMIT_PER_MINUTE: int = 120

    # --- SMTP / Mailjet ---
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    MAIL_FROM: Optional[EmailStr] = None

    # Pydantic v2 config
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
