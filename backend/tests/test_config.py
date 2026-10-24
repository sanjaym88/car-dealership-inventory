"""Settings that matter when deploying: hosted database URLs and the JWT secret."""
import pytest
from pydantic import ValidationError

from app.core.config import Settings

STRONG_SECRET = "x" * 32


def make_settings(**values) -> Settings:
    # _env_file=None: ignore any local .env so the test only sees what it passes in.
    return Settings(_env_file=None, **values)


@pytest.mark.parametrize(
    "given, expected",
    [
        # Neon, Render and Heroku hand out plain postgres URLs; SQLAlchemy needs the driver named.
        (
            "postgresql://u:p@ep-x.neon.tech/db?sslmode=require",
            "postgresql+psycopg://u:p@ep-x.neon.tech/db?sslmode=require",
        ),
        ("postgres://u:p@host:5432/db", "postgresql+psycopg://u:p@host:5432/db"),
        ("postgresql+psycopg://u:p@host/db", "postgresql+psycopg://u:p@host/db"),
    ],
)
def test_database_url_gets_the_psycopg_driver(given, expected):
    assert make_settings(database_url=given).database_url == expected


def test_development_allows_the_default_secret():
    assert make_settings().jwt_secret == "change-me"


@pytest.mark.parametrize("secret", ["change-me", "short-secret", ""])
def test_production_refuses_a_default_or_weak_secret(secret):
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        make_settings(environment="production", jwt_secret=secret)


def test_production_accepts_a_strong_secret():
    settings = make_settings(environment="production", jwt_secret=STRONG_SECRET)

    assert settings.jwt_secret == STRONG_SECRET
