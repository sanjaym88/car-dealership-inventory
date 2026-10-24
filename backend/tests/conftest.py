import os

# Must be set before the app is imported, since settings are read at import time.
os.environ.setdefault("BCRYPT_ROUNDS", "4")  # minimum cost: fast tests, same code path
# Fixtures use example.com, which accepts no mail by design; test_email_domain.py covers the check.
os.environ.setdefault("CHECK_EMAIL_DOMAIN", "false")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import app.models  # noqa: F401  (registers models on Base.metadata)
from app.core.database import Base, get_db
from app.main import app

# Tests run against a separate Postgres (docker compose service `db_test`).
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql+psycopg://car:car@localhost:5433/car_test"
)
engine = create_engine(TEST_DATABASE_URL)


@pytest.fixture(scope="session", autouse=True)
def database_schema():
    """Create the tables once for the whole test run."""
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def db_session():
    """Each test runs inside one outer transaction that is rolled back afterwards.

    The app's own commit() calls only release savepoints, so nothing a test writes survives it,
    and tests never see each other's data.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection,
        autoflush=False,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


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


SAMPLE_VEHICLE = {
    "make": "Toyota",
    "model": "Camry",
    "category": "Sedan",
    "price": 25000.0,
    "quantity": 5,
}


@pytest.fixture
def create_vehicle(client, user_headers):
    """Factory: add a vehicle through the API (sample values overridable) and return its JSON."""

    def _create(**overrides) -> dict:
        response = client.post(
            "/api/vehicles", json={**SAMPLE_VEHICLE, **overrides}, headers=user_headers
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _create
