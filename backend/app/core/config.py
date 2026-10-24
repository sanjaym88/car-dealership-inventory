"""Application settings, loaded from environment variables or a .env file."""
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_JWT_SECRET = "change-me"
MIN_PRODUCTION_SECRET_LENGTH = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "production"] = "development"
    database_url: str = "postgresql+psycopg://car:car@localhost:5432/car"
    jwt_secret: str = DEFAULT_JWT_SECRET
    jwt_expire_minutes: int = 60
    # bcrypt work factor: 12 is a sensible production cost; tests lower it for speed.
    bcrypt_rounds: int = 12
    # Reject sign-ups whose email domain has no mail servers (a DNS lookup per registration).
    check_email_domain: bool = True

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, url: str) -> str:
        """Hosting providers hand out postgres:// URLs; SQLAlchemy needs the driver spelled out."""
        for prefix in ("postgresql://", "postgres://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url.removeprefix(prefix)
        return url

    @model_validator(mode="after")
    def require_strong_secret_in_production(self) -> "Settings":
        # Anyone who knows the signing secret can forge login tokens, so never ship the default.
        if self.environment == "production" and (
            self.jwt_secret == DEFAULT_JWT_SECRET
            or len(self.jwt_secret) < MIN_PRODUCTION_SECRET_LENGTH
        ):
            raise ValueError(
                f"JWT_SECRET must be set to a random value of at least "
                f"{MIN_PRODUCTION_SECRET_LENGTH} characters in production"
            )
        return self


settings = Settings()
