from sqlalchemy import select

from app.models.user import User

REGISTER_URL = "/api/auth/register"


def test_register_returns_201_with_new_user(client):
    response = client.post(
        REGISTER_URL,
        json={"email": "alice@example.com", "password": "secret123"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert "id" in body
    assert "password" not in body


def test_register_rejects_duplicate_email(client, register_user):
    register_user("alice@example.com")

    response = client.post(REGISTER_URL, json={"email": "alice@example.com", "password": "secret123"})

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered"


def test_register_stores_hashed_password_not_plaintext(register_user, db_session):
    register_user("bob@example.com", "secret123")

    user = db_session.scalars(select(User).where(User.email == "bob@example.com")).one()
    assert user.hashed_password != "secret123"
    assert user.hashed_password.startswith("$2")  # bcrypt hash prefix


def test_register_new_users_are_not_admin(client):
    response = client.post(
        REGISTER_URL, json={"email": "carol@example.com", "password": "secret123"}
    )

    assert response.json()["is_admin"] is False


def test_register_rejects_invalid_email(client):
    response = client.post(REGISTER_URL, json={"email": "not-an-email", "password": "secret123"})

    assert response.status_code == 422


def test_register_rejects_short_password(client):
    response = client.post(REGISTER_URL, json={"email": "dave@example.com", "password": "123"})

    assert response.status_code == 422
