"""Edge cases found by scripts/stress_test.py against the running stack."""

import pytest

from app.core.login_throttle import login_throttle

LOGIN_URL = "/api/auth/login"


# --- emails are case-insensitive ---


def test_same_email_in_another_case_is_a_duplicate(client, register_user):
    register_user("Alice@example.com")

    response = client.post("/api/auth/register", json={"email": "ALICE@EXAMPLE.COM", "password": "secret123"})

    assert response.status_code == 409


def test_emails_are_stored_in_lower_case(register_user):
    assert register_user("Bob.Smith@Example.com")["email"] == "bob.smith@example.com"


def test_login_ignores_email_case(client, register_user):
    register_user("carol@example.com")

    response = client.post(LOGIN_URL, json={"email": "CAROL@Example.COM", "password": "secret123"})

    assert response.status_code == 200


# --- numbers too large for the database are rejected, not a crash ---


@pytest.mark.parametrize("field, value", [("price", 1e15), ("quantity", 10**12)])
def test_create_rejects_numbers_beyond_the_limits(client, user_headers, field, value):
    from tests.conftest import SAMPLE_VEHICLE

    response = client.post("/api/vehicles", json={**SAMPLE_VEHICLE, field: value}, headers=user_headers)

    assert response.status_code == 422


def test_update_rejects_numbers_beyond_the_limits(client, user_headers, create_vehicle):
    vehicle = create_vehicle()

    response = client.put(f"/api/vehicles/{vehicle['id']}", json={"price": 1e15}, headers=user_headers)

    assert response.status_code == 422


def test_restock_rejects_a_huge_amount(client, admin_headers, create_vehicle):
    vehicle = create_vehicle()

    response = client.post(f"/api/vehicles/{vehicle['id']}/restock", json={"quantity": 10**12}, headers=admin_headers)

    assert response.status_code == 422


def test_restock_cannot_push_stock_past_the_maximum(client, admin_headers, create_vehicle):
    vehicle = create_vehicle(quantity=99_000)

    response = client.post(f"/api/vehicles/{vehicle['id']}/restock", json={"quantity": 5_000}, headers=admin_headers)

    assert response.status_code == 422
    assert response.json()["detail"] == "Stock cannot exceed 100,000 units"


@pytest.mark.parametrize(
    "method, path",
    [
        ("put", "/api/vehicles/{id}"),
        ("delete", "/api/vehicles/{id}"),
        ("post", "/api/vehicles/{id}/purchase"),
        ("post", "/api/vehicles/{id}/restock"),
    ],
)
def test_ids_beyond_the_database_range_are_rejected(client, admin_headers, method, path):
    url = path.format(id=99999999999999999999)

    response = client.request(method, url, json={"quantity": 1}, headers=admin_headers)

    assert response.status_code == 422


# --- repeated wrong passwords are throttled ---


@pytest.fixture
def clock(monkeypatch):
    """Controllable time for the login throttle."""
    now = [1000.0]
    monkeypatch.setattr(login_throttle, "clock", lambda: now[0])
    return now


def wrong_login(client, email="alice@example.com"):
    return client.post(LOGIN_URL, json={"email": email, "password": "wrong-pass"})


def test_too_many_wrong_passwords_lock_the_account_for_a_while(client, register_user, clock):
    register_user("alice@example.com")
    for _ in range(5):
        assert wrong_login(client).status_code == 401

    blocked = client.post(LOGIN_URL, json={"email": "alice@example.com", "password": "secret123"})

    assert blocked.status_code == 429
    assert blocked.json()["detail"] == "Too many failed attempts. Try again in 15 minutes."
    assert int(blocked.headers["Retry-After"]) > 0


def test_the_lock_lifts_after_the_window(client, register_user, clock):
    register_user("alice@example.com")
    for _ in range(5):
        wrong_login(client)

    clock[0] += 15 * 60

    assert client.post(LOGIN_URL, json={"email": "alice@example.com", "password": "secret123"}).status_code == 200


def test_the_lock_is_per_email_and_ignores_case(client, register_user, clock):
    register_user("alice@example.com")
    register_user("bob@example.com")
    for _ in range(5):
        wrong_login(client, "ALICE@example.com")

    assert wrong_login(client, "alice@example.com").status_code == 429
    assert client.post(LOGIN_URL, json={"email": "bob@example.com", "password": "secret123"}).status_code == 200


def test_a_successful_login_resets_the_count(client, register_user, clock):
    register_user("alice@example.com")
    for _ in range(4):
        wrong_login(client)
    client.post(LOGIN_URL, json={"email": "alice@example.com", "password": "secret123"})

    for _ in range(4):
        assert wrong_login(client).status_code == 401
