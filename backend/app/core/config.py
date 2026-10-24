"""Application settings, loaded from environment variables or a .env file."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://car:car@localhost:5432/car"
    jwt_secret: str = "change-me"
    jwt_expire_minutes: int = 60


settings = Settings()
