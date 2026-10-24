"""Checkout customisation and order history.

Buying a car records an order with the chosen options. Prices always come from the server's
catalog and the vehicle's current price; nothing price-related is accepted from the client.
"""
import pytest

OPTIONS_URL = "/api/checkout/options"
MY_ORDERS_URL = "/api/orders/me"
ALL_ORDERS_URL = "/api/orders"


def purchase(client, headers, vehicle_id: int, **selection):
    return client.post(f"/api/vehicles/{vehicle_id}/purchase", json=selection or None, headers=headers)


# --- options catalog ---


def test_checkout_options_lists_every_choice_with_prices(client, user_headers):
    response = client.get(OPTIONS_URL, headers=user_headers)

    assert response.status_code == 200
    options = response.json()
    assert {c["code"] for c in options["colors"]} == {
        "arctic_white", "midnight_black", "racing_red", "ocean_blue",
    }
    assert {p["code"]: p["price"] for p in options["packages"]} == {
        "standard": 0, "premium": 3500, "sport": 2800,
    }
    assert {a["code"]: a["price"] for a in options["addons"]} == {
        "extended_warranty": 1200, "tinted_windows": 300,
        "all_weather_mats": 150, "ceramic_coating": 900,
    }
    assert {d["code"]: d["price"] for d in options["delivery"]} == {"pickup": 0, "home": 250}
    assert all(item["label"] for group in options.values() for item in group)


def test_checkout_options_require_login(client):
    assert client.get(OPTIONS_URL).status_code == 401


# --- purchasing with customisation ---


def test_purchase_without_choices_uses_defaults_and_base_price(client, user_headers, create_vehicle):
    vehicle = create_vehicle(price=25000)

    order = purchase(client, user_headers, vehicle["id"]).json()["order"]

    assert order["color"] == "arctic_white"
    assert order["package"] == "standard"
    assert order["addons"] == []
    assert order["delivery"] == "pickup"
    assert order["total_price"] == 25000


def test_purchase_total_adds_every_chosen_option(client, user_headers, create_vehicle):
    vehicle = create_vehicle(price=25000)

    order = purchase(
        client, user_headers, vehicle["id"],
        color="racing_red", package="premium",
        addons=["extended_warranty", "tinted_windows"], delivery="home",
    ).json()["order"]

    # 25000 + red 500 + premium 3500 + warranty 1200 + tint 300 + delivery 250
    assert order["total_price"] == 30750


def test_order_has_a_receipt_of_line_items(client, user_headers, create_vehicle):
    vehicle = create_vehicle(make="Toyota", model="Camry", price=25000)

    order = purchase(
        client, user_headers, vehicle["id"], color="ocean_blue", addons=["all_weather_mats"],
    ).json()["order"]

    assert order["line_items"] == [
        {"label": "Toyota Camry (base price)", "price": 25000},
        {"label": "Paint: Ocean Blue", "price": 500},
        {"label": "Package: Standard", "price": 0},
        {"label": "Add-on: All-weather mats", "price": 150},
        {"label": "Delivery: Pick up at dealership", "price": 0},
    ]
    assert sum(item["price"] for item in order["line_items"]) == order["total_price"]


def test_order_snapshots_the_vehicle(client, user_headers, create_vehicle):
    vehicle = create_vehicle(make="Ford", model="Mustang", category="Coupe", price=45000)

    order = purchase(client, user_headers, vehicle["id"]).json()["order"]

    assert order["vehicle_id"] == vehicle["id"]
    assert (order["make"], order["model"], order["category"]) == ("Ford", "Mustang", "Coupe")
    assert order["base_price"] == 45000
    assert order["id"] > 0
    assert order["created_at"]


def test_duplicate_addons_are_charged_once(client, user_headers, create_vehicle):
    vehicle = create_vehicle(price=10000)

    order = purchase(
        client, user_headers, vehicle["id"], addons=["tinted_windows", "tinted_windows"],
    ).json()["order"]

    assert order["addons"] == ["tinted_windows"]
    assert order["total_price"] == 10300


@pytest.mark.parametrize(
    "selection",
    [
        {"color": "neon_pink"},
        {"package": "platinum"},
        {"addons": ["jetpack"]},
        {"delivery": "drone"},
    ],
)
def test_unknown_options_are_rejected_without_buying(client, user_headers, create_vehicle, selection):
    vehicle = create_vehicle(quantity=2)

    response = purchase(client, user_headers, vehicle["id"], **selection)

    assert response.status_code == 422
    stock = client.get("/api/vehicles", headers=user_headers).json()[0]["quantity"]
    assert stock == 2


def test_client_cannot_set_the_price(client, user_headers, create_vehicle):
    vehicle = create_vehicle(price=25000)

    response = purchase(client, user_headers, vehicle["id"], total_price=1)

    assert response.json()["order"]["total_price"] == 25000


def test_failed_purchase_records_no_order(client, user_headers, create_vehicle):
    vehicle = create_vehicle(quantity=0)

    purchase(client, user_headers, vehicle["id"])

    assert client.get(MY_ORDERS_URL, headers=user_headers).json() == []


# --- order history ---


def test_my_orders_lists_only_my_orders_newest_first(
    client, register_user, login_headers, create_vehicle,
):
    camry = create_vehicle(model="Camry")
    civic = create_vehicle(model="Civic")
    register_user("bob@example.com")
    bob = login_headers("bob@example.com")
    register_user("carol@example.com")
    carol = login_headers("carol@example.com")
    purchase(client, bob, camry["id"])
    purchase(client, carol, camry["id"])
    purchase(client, bob, civic["id"])

    orders = client.get(MY_ORDERS_URL, headers=bob).json()

    assert [o["model"] for o in orders] == ["Civic", "Camry"]


def test_my_orders_requires_login(client):
    assert client.get(MY_ORDERS_URL).status_code == 401


def test_admin_sees_all_orders_with_buyer_email(client, user_headers, admin_headers, create_vehicle):
    vehicle = create_vehicle()
    purchase(client, user_headers, vehicle["id"])
    purchase(client, admin_headers, vehicle["id"])

    orders = client.get(ALL_ORDERS_URL, headers=admin_headers).json()

    assert sorted(o["buyer_email"] for o in orders) == ["admin@example.com", "user@example.com"]


def test_regular_users_cannot_list_all_orders(client, user_headers):
    assert client.get(ALL_ORDERS_URL, headers=user_headers).status_code == 403


def test_orders_survive_the_vehicle_being_deleted(client, user_headers, admin_headers, create_vehicle):
    vehicle = create_vehicle(make="Honda", model="Civic")
    purchase(client, user_headers, vehicle["id"])

    assert client.delete(f"/api/vehicles/{vehicle['id']}", headers=admin_headers).status_code == 204

    [order] = client.get(MY_ORDERS_URL, headers=user_headers).json()
    assert order["vehicle_id"] is None
    assert order["model"] == "Civic"
