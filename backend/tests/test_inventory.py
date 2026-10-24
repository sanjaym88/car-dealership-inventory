"""Inventory: any logged-in user can purchase (stock -1); only admins can restock (stock +n)."""
import pytest

VEHICLES_URL = "/api/vehicles"


def purchase_url(vehicle_id: int) -> str:
    return f"{VEHICLES_URL}/{vehicle_id}/purchase"


def restock_url(vehicle_id: int) -> str:
    return f"{VEHICLES_URL}/{vehicle_id}/restock"


def stock_of(client, headers, vehicle_id: int) -> int:
    vehicles = client.get(VEHICLES_URL, headers=headers).json()
    return next(v["quantity"] for v in vehicles if v["id"] == vehicle_id)


# --- purchase ---


def test_purchase_decreases_quantity_by_one(client, user_headers, create_vehicle):
    vehicle = create_vehicle(quantity=3)

    response = client.post(purchase_url(vehicle["id"]), headers=user_headers)

    assert response.status_code == 200
    assert response.json() == {**vehicle, "quantity": 2}
    assert stock_of(client, user_headers, vehicle["id"]) == 2


def test_purchase_of_last_unit_leaves_zero(client, user_headers, create_vehicle):
    vehicle = create_vehicle(quantity=1)

    response = client.post(purchase_url(vehicle["id"]), headers=user_headers)

    assert response.json()["quantity"] == 0


def test_purchase_when_out_of_stock_is_409_and_stock_stays_zero(client, user_headers, create_vehicle):
    vehicle = create_vehicle(quantity=0)

    response = client.post(purchase_url(vehicle["id"]), headers=user_headers)

    assert response.status_code == 409
    assert response.json()["detail"] == "Vehicle is out of stock"
    assert stock_of(client, user_headers, vehicle["id"]) == 0


def test_purchase_missing_vehicle_is_404(client, user_headers):
    response = client.post(purchase_url(99999), headers=user_headers)

    assert response.status_code == 404


def test_purchase_requires_login(client, create_vehicle):
    vehicle = create_vehicle()

    response = client.post(purchase_url(vehicle["id"]))

    assert response.status_code == 401


# --- restock ---


def test_admin_restock_increases_quantity(client, admin_headers, create_vehicle):
    vehicle = create_vehicle(quantity=2)

    response = client.post(restock_url(vehicle["id"]), json={"quantity": 5}, headers=admin_headers)

    assert response.status_code == 200
    assert response.json() == {**vehicle, "quantity": 7}


def test_restock_makes_sold_out_vehicle_purchasable(
    client, admin_headers, user_headers, create_vehicle
):
    vehicle = create_vehicle(quantity=0)
    client.post(restock_url(vehicle["id"]), json={"quantity": 1}, headers=admin_headers)

    response = client.post(purchase_url(vehicle["id"]), headers=user_headers)

    assert response.status_code == 200


def test_regular_user_cannot_restock(client, user_headers, create_vehicle):
    vehicle = create_vehicle(quantity=2)

    response = client.post(restock_url(vehicle["id"]), json={"quantity": 5}, headers=user_headers)

    assert response.status_code == 403
    assert stock_of(client, user_headers, vehicle["id"]) == 2


def test_restock_missing_vehicle_is_404(client, admin_headers):
    response = client.post(restock_url(99999), json={"quantity": 5}, headers=admin_headers)

    assert response.status_code == 404


@pytest.mark.parametrize("body", [{"quantity": 0}, {"quantity": -3}, {}])
def test_restock_rejects_non_positive_or_missing_quantity(
    client, admin_headers, create_vehicle, body
):
    vehicle = create_vehicle()

    response = client.post(restock_url(vehicle["id"]), json=body, headers=admin_headers)

    assert response.status_code == 422


def test_restock_requires_login(client, create_vehicle):
    vehicle = create_vehicle()

    response = client.post(restock_url(vehicle["id"]), json={"quantity": 5})

    assert response.status_code == 401
