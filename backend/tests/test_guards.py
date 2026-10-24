"""Auth guard (valid token required) and admin guard (admin role required)."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.api.deps import require_admin
from app.core.config import settings
from app.core.database import get_db
from app.core.security import JWT_ALGORITHM

ME_URL = "/api/auth/me"


def make_token(sub: str, expires_in: timedelta, secret: str = settings.jwt_secret) -> str:
    payload = {"sub": sub, "exp": datetime.now(UTC) + expires_in}
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# --- auth guard, exercised through GET /api/auth/me ---


def test_me_returns_current_user(client, user_headers):
    response = client.get(ME_URL, headers=user_headers)

    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"
    assert response.json()["is_admin"] is False


def test_me_without_token_is_401(client):
    response = client.get(ME_URL)

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_me_with_garbage_token_is_401(client):
    response = client.get(ME_URL, headers=bearer("not-a-jwt"))

    assert response.status_code == 401


def test_me_with_token_signed_by_wrong_secret_is_401(client, register_user):
    user = register_user()
    forged = make_token(str(user["id"]), timedelta(minutes=5), secret="attacker-secret")

    response = client.get(ME_URL, headers=bearer(forged))

    assert response.status_code == 401


def test_me_with_expired_token_is_401(client, register_user):
    user = register_user()
    expired = make_token(str(user["id"]), timedelta(minutes=-1))

    response = client.get(ME_URL, headers=bearer(expired))

    assert response.status_code == 401


def test_me_with_token_for_missing_user_is_401(client):
    response = client.get(ME_URL, headers=bearer(make_token("99999", timedelta(minutes=5))))

    assert response.status_code == 401


# --- admin guard, exercised through a probe route ---


@pytest.fixture
def admin_probe(db_session):
    """Minimal app with one admin-only route, until real admin endpoints exist."""
    probe = FastAPI()

    @probe.get("/admin-only", dependencies=[Depends(require_admin)])
    def admin_only():
        return {"ok": True}

    probe.dependency_overrides[get_db] = lambda: db_session
    return TestClient(probe)


def test_admin_guard_allows_admin(admin_probe, admin_headers):
    response = admin_probe.get("/admin-only", headers=admin_headers)

    assert response.status_code == 200


def test_admin_guard_rejects_regular_user_with_403(admin_probe, user_headers):
    response = admin_probe.get("/admin-only", headers=user_headers)

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin privileges required"


def test_admin_guard_rejects_anonymous_with_401(admin_probe):
    response = admin_probe.get("/admin-only")

    assert response.status_code == 401
