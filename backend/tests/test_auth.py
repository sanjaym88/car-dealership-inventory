def test_register_returns_201_with_new_user(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "password": "secret123"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert "id" in body
    assert "password" not in body