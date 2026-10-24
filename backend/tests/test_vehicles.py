"""Vehicle CRUD: any logged-in user can add, list and update; only admins can delete."""
import pytest

from tests.conftest import SAMPLE_VEHICLE

VEHICLES_URL = "/api/vehicles"


def vehicle_url(vehicle_id: int) -> str:
    return f"{VEHICLES_URL}/{vehicle_id}"


# --- create ---


def test_create_vehicle_returns_201_with_generated_id(client, user_headers):
    response = client.post(VEHICLES_URL, json=SAMPLE_VEHICLE, headers=user_headers)

    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["id"], int)
    assert {k: body[k] for k in SAMPLE_VEHICLE} == SAMPLE_VEHICLE


def test_create_vehicle_ids_are_unique(create_vehicle):
    first = create_vehicle()
    second = create_vehicle(model="Corolla")

    assert first["id"] != second["id"]


def test_create_vehicle_requires_login(client):
    response = client.post(VEHICLES_URL, json=SAMPLE_VEHICLE)

    assert response.status_code == 401


@pytest.mark.parametrize("missing_field", list(SAMPLE_VEHICLE))
def test_create_vehicle_rejects_missing_field(client, user_headers, missing_field):
    payload = {k: v for k, v in SAMPLE_VEHICLE.items() if k != missing_field}

    response = client.post(VEHICLES_URL, json=payload, headers=user_headers)

    assert response.status_code == 422


@pytest.mark.parametrize(
    "bad_values",
    [
        {"price": 0},
        {"price": -100},
        {"quantity": -1},
        {"make": ""},
        {"model": "   "},
        {"category": ""},
    ],
)
def test_create_vehicle_rejects_invalid_values(client, user_headers, bad_values):
    response = client.post(
        VEHICLES_URL, json={**SAMPLE_VEHICLE, **bad_values}, headers=user_headers
    )

    assert response.status_code == 422


# --- list ---


def test_list_vehicles_is_empty_initially(client, user_headers):
    response = client.get(VEHICLES_URL, headers=user_headers)

    assert response.status_code == 200
    assert response.json() == []


def test_list_vehicles_returns_all_vehicles(client, user_headers, create_vehicle):
    camry = create_vehicle()
    sold_out = create_vehicle(make="Ford", model="Mustang", category="Coupe", quantity=0)

    response = client.get(VEHICLES_URL, headers=user_headers)

    assert response.status_code == 200
    assert response.json() == [camry, sold_out]


def test_list_vehicles_requires_login(client):
    response = client.get(VEHICLES_URL)

    assert response.status_code == 401


# --- update ---


def test_update_vehicle_changes_only_given_fields(client, user_headers, create_vehicle):
    vehicle = create_vehicle()

    response = client.put(vehicle_url(vehicle["id"]), json={"price": 23999.99}, headers=user_headers)

    assert response.status_code == 200
    assert response.json() == {**vehicle, "price": 23999.99}


def test_update_vehicle_is_persisted(client, user_headers, create_vehicle):
    vehicle = create_vehicle()
    client.put(vehicle_url(vehicle["id"]), json={"model": "Camry Hybrid"}, headers=user_headers)

    listed = client.get(VEHICLES_URL, headers=user_headers).json()

    assert listed[0]["model"] == "Camry Hybrid"


def test_update_missing_vehicle_is_404(client, user_headers):
    response = client.put(vehicle_url(99999), json={"price": 1000}, headers=user_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"


def test_update_vehicle_rejects_invalid_values(client, user_headers, create_vehicle):
    vehicle = create_vehicle()

    response = client.put(vehicle_url(vehicle["id"]), json={"price": -5}, headers=user_headers)

    assert response.status_code == 422


def test_update_vehicle_requires_login(client, create_vehicle):
    vehicle = create_vehicle()

    response = client.put(vehicle_url(vehicle["id"]), json={"price": 1000})

    assert response.status_code == 401


# --- delete ---


def test_admin_can_delete_vehicle(client, admin_headers, create_vehicle):
    vehicle = create_vehicle()

    response = client.delete(vehicle_url(vehicle["id"]), headers=admin_headers)

    assert response.status_code == 204
    assert client.get(VEHICLES_URL, headers=admin_headers).json() == []


def test_regular_user_cannot_delete_vehicle(client, user_headers, create_vehicle):
    vehicle = create_vehicle()

    response = client.delete(vehicle_url(vehicle["id"]), headers=user_headers)

    assert response.status_code == 403
    assert len(client.get(VEHICLES_URL, headers=user_headers).json()) == 1


def test_delete_missing_vehicle_is_404(client, admin_headers):
    response = client.delete(vehicle_url(99999), headers=admin_headers)

    assert response.status_code == 404


def test_delete_vehicle_requires_login(client, create_vehicle):
    vehicle = create_vehicle()

    response = client.delete(vehicle_url(vehicle["id"]))

    assert response.status_code == 401
