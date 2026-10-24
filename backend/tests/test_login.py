import jwt
import pytest

from app.core.config import settings
from app.core.security import JWT_ALGORITHM

LOGIN_URL = "/api/auth/login"
CREDENTIALS = {"email": "alice@example.com", "password": "secret123"}


@pytest.fixture
def registered_user(register_user):
    return register_user(**CREDENTIALS)


def test_login_returns_bearer_token(client, registered_user):
    response = client.post(LOGIN_URL, json=CREDENTIALS)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_token_identifies_the_user(client, registered_user):
    token = client.post(LOGIN_URL, json=CREDENTIALS).json()["access_token"]

    payload = jwt.decode(token, settings.jwt_secret, algorithms=[JWT_ALGORITHM])
    assert payload["sub"] == str(registered_user["id"])
    assert "exp" in payload


def test_login_rejects_wrong_password(client, registered_user):
    response = client.post(LOGIN_URL, json={**CREDENTIALS, "password": "wrong-password"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_rejects_unknown_email_with_same_message(client):
    # Same message as a wrong password, so attackers can't tell which emails exist.
    response = client.post(LOGIN_URL, json=CREDENTIALS)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_rejects_missing_fields(client):
    response = client.post(LOGIN_URL, json={"email": "alice@example.com"})

    assert response.status_code == 422
