"""Registration rejects email addresses whose domain cannot receive mail.

The DNS lookup is replaced in these tests so they never depend on the network. The rest of the
suite runs with the check switched off (CHECK_EMAIL_DOMAIN=false in conftest), because its
fixtures use example.com, which by design accepts no mail.
"""

import email_validator
import pytest

from app.core import email_domain
from app.core.config import settings

REGISTER_URL = "/api/auth/register"


@pytest.fixture
def domain_check(monkeypatch):
    """Turn the check on and decide, per domain, whether it accepts mail."""
    accepting = {"gmail.com"}
    monkeypatch.setattr(settings, "check_email_domain", True)
    monkeypatch.setattr(email_domain, "domain_accepts_mail", lambda email: email.split("@")[1] in accepting)
    return accepting


def test_rejects_an_email_whose_domain_cannot_receive_mail(client, domain_check):
    response = client.post(
        REGISTER_URL, json={"email": "someone@no-such-domain-xyz.com", "password": "secret123"}
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "This email's domain can't receive mail"


def test_accepts_an_email_at_a_real_mail_domain(client, domain_check):
    response = client.post(REGISTER_URL, json={"email": "someone@gmail.com", "password": "secret123"})

    assert response.status_code == 201


def test_check_can_be_switched_off(client, monkeypatch):
    monkeypatch.setattr(settings, "check_email_domain", False)
    monkeypatch.setattr(email_domain, "domain_accepts_mail", lambda email: False)

    response = client.post(REGISTER_URL, json={"email": "a@example.com", "password": "secret123"})

    assert response.status_code == 201


def test_login_does_not_look_up_the_domain(client, register_user, monkeypatch):
    register_user("alice@example.com", "secret123")
    monkeypatch.setattr(settings, "check_email_domain", True)
    monkeypatch.setattr(email_domain, "domain_accepts_mail", lambda email: False)

    response = client.post("/api/auth/login", json={"email": "alice@example.com", "password": "secret123"})

    assert response.status_code == 200


# --- the lookup itself ---


def test_domain_without_mail_servers_is_rejected(monkeypatch):
    def undeliverable(email, **kwargs):
        raise email_validator.EmailUndeliverableError("The domain name does not accept email.")

    monkeypatch.setattr(email_domain, "validate_email", undeliverable)

    assert email_domain.domain_accepts_mail("a@nowhere.test") is False


def test_domain_with_mail_servers_is_accepted(monkeypatch):
    calls = {}

    def deliverable(email, **kwargs):
        calls.update(kwargs)

    monkeypatch.setattr(email_domain, "validate_email", deliverable)

    assert email_domain.domain_accepts_mail("a@gmail.com") is True
    assert calls["check_deliverability"] is True
