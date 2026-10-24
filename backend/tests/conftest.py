import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  (registers models on Base.metadata)
from app.core.database import Base, get_db
from app.main import app

# Tests run against a separate Postgres (docker compose service `db_test`).
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql+psycopg://car:car@localhost:5433/car_test"
)
engine = create_engine(TEST_DATABASE_URL)
TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture
def db_session():
    """Fresh tables for every test, dropped afterwards, so tests never share data."""
    Base.metadata.create_all(engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def client(db_session):
    """HTTP client whose requests use the test database session."""
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def register_user(client):
    """Factory: register a user through the API and return the response JSON."""

    def _register(email: str = "alice@example.com", password: str = "secret123") -> dict:
        response = client.post("/api/auth/register", json={"email": email, "password": password})
        assert response.status_code == 201, response.text
        return response.json()

    return _register


@pytest.fixture
def login_headers(client):
    """Factory: log in and return an Authorization header for that user."""

    def _login(email: str = "alice@example.com", password: str = "secret123") -> dict:
        response = client.post("/api/auth/login", json={"email": email, "password": password})
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _login


@pytest.fixture
def user_headers(register_user, login_headers):
    """Auth header for a regular (non-admin) user."""
    register_user("user@example.com")
    return login_headers("user@example.com")


@pytest.fixture
def admin_headers(register_user, login_headers, db_session):
    """Auth header for an admin. Registration never grants admin, so promote directly in the DB."""
    from app.models.user import User

    created = register_user("admin@example.com")
    db_session.get(User, created["id"]).is_admin = True
    db_session.commit()
    return login_headers("admin@example.com")
