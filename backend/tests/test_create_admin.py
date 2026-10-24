"""`python -m app.scripts.create_admin`: creates an admin, or promotes an existing user to admin."""
import pytest
from sqlalchemy import select

from app.models.user import User
from app.scripts.create_admin import main


def run(db_session, *args: str) -> int:
    return main(list(args), session_factory=lambda: db_session)


def find_user(db_session, email: str) -> User | None:
    return db_session.scalars(select(User).where(User.email == email)).first()


def test_creates_new_admin_who_can_log_in(client, db_session):
    exit_code = run(db_session, "--email", "boss@example.com", "--password", "supersecret")

    assert exit_code == 0
    assert find_user(db_session, "boss@example.com").is_admin is True
    login = client.post(
        "/api/auth/login", json={"email": "boss@example.com", "password": "supersecret"}
    )
    assert login.status_code == 200


def test_promotes_existing_user_without_changing_password(client, db_session, register_user):
    register_user("alice@example.com", "original-pass")

    exit_code = run(db_session, "--email", "alice@example.com", "--password", "ignored-pass")

    assert exit_code == 0
    assert find_user(db_session, "alice@example.com").is_admin is True
    login = client.post(
        "/api/auth/login", json={"email": "alice@example.com", "password": "original-pass"}
    )
    assert login.status_code == 200


def test_promoted_user_passes_admin_guard(client, db_session, register_user, login_headers):
    register_user("alice@example.com", "secret123")
    run(db_session, "--email", "alice@example.com", "--password", "secret123")

    me = client.get("/api/auth/me", headers=login_headers("alice@example.com", "secret123"))

    assert me.json()["is_admin"] is True


@pytest.mark.parametrize(
    "args",
    [
        ("--email", "not-an-email", "--password", "supersecret"),
        ("--email", "boss@example.com", "--password", "short"),
    ],
)
def test_rejects_invalid_input_without_creating_anyone(db_session, args, capsys):
    exit_code = run(db_session, *args)

    assert exit_code == 1
    assert "Invalid" in capsys.readouterr().err
    assert db_session.scalars(select(User)).all() == []


def test_admin_script_skips_the_email_domain_check(db_session, monkeypatch):
    # The operator running the script is trusted; e.g. admin@example.com for a local demo.
    from app.core import email_domain
    from app.core.config import settings

    monkeypatch.setattr(settings, "check_email_domain", True)
    monkeypatch.setattr(email_domain, "domain_accepts_mail", lambda email: False)

    exit_code = run(db_session, "--email", "admin@example.com", "--password", "supersecret")

    assert exit_code == 0
    assert find_user(db_session, "admin@example.com").is_admin is True
