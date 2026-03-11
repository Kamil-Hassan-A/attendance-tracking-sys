"""
Application configuration using Pydantic Settings.
Reads from .env file in the project root.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    # CORS
    ALLOWED_ORIGINS: list[str]

    # App
    ENV: str
    DEBUG: bool

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
