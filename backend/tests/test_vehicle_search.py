"""GET /api/vehicles/search: filter by make, model, category and price range.

Every filter is optional; given filters are combined with AND.
"""

import pytest

SEARCH_URL = "/api/vehicles/search"


@pytest.fixture
def inventory(create_vehicle):
    """A small, varied inventory; returned keyed by a short name."""
    return {
        "camry": create_vehicle(make="Toyota", model="Camry", category="Sedan", price=25000),
        "rav4": create_vehicle(make="Toyota", model="RAV4", category="SUV", price=32000),
        "mustang": create_vehicle(make="Ford", model="Mustang", category="Coupe", price=45000),
        "explorer": create_vehicle(make="Ford", model="Explorer", category="SUV", price=38000),
    }


def search(client, headers, **params) -> list[dict]:
    response = client.get(SEARCH_URL, params=params, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def ids(vehicles: list[dict]) -> set[int]:
    return {v["id"] for v in vehicles}


def test_search_by_make_is_case_insensitive_and_partial(client, user_headers, inventory):
    result = search(client, user_headers, make="toy")

    assert ids(result) == {inventory["camry"]["id"], inventory["rav4"]["id"]}


def test_search_by_model(client, user_headers, inventory):
    result = search(client, user_headers, model="must")

    assert ids(result) == {inventory["mustang"]["id"]}


def test_search_by_category_matches_whole_category_ignoring_case(client, user_headers, inventory):
    assert ids(search(client, user_headers, category="suv")) == {
        inventory["rav4"]["id"],
        inventory["explorer"]["id"],
    }
    assert search(client, user_headers, category="SU") == []


def test_search_by_price_range_is_inclusive(client, user_headers, inventory):
    result = search(client, user_headers, min_price=32000, max_price=38000)

    assert ids(result) == {inventory["rav4"]["id"], inventory["explorer"]["id"]}


def test_search_with_only_min_price(client, user_headers, inventory):
    assert ids(search(client, user_headers, min_price=40000)) == {inventory["mustang"]["id"]}


def test_search_with_only_max_price(client, user_headers, inventory):
    assert ids(search(client, user_headers, max_price=25000)) == {inventory["camry"]["id"]}


def test_search_combines_filters_with_and(client, user_headers, inventory):
    result = search(client, user_headers, make="ford", category="suv", max_price=40000)

    assert ids(result) == {inventory["explorer"]["id"]}


def test_search_without_filters_returns_everything(client, user_headers, inventory):
    assert len(search(client, user_headers)) == len(inventory)


def test_search_with_no_matches_returns_empty_list(client, user_headers, inventory):
    assert search(client, user_headers, make="Ferrari") == []


def test_search_treats_wildcard_characters_literally(client, user_headers, inventory):
    # "%" must not act as a SQL wildcard that matches everything.
    assert search(client, user_headers, make="%") == []


def test_search_rejects_min_price_above_max_price(client, user_headers):
    response = client.get(SEARCH_URL, params={"min_price": 50000, "max_price": 10000}, headers=user_headers)

    assert response.status_code == 422


def test_search_rejects_negative_price(client, user_headers):
    response = client.get(SEARCH_URL, params={"min_price": -1}, headers=user_headers)

    assert response.status_code == 422


def test_search_requires_login(client):
    response = client.get(SEARCH_URL, params={"make": "Toyota"})

    assert response.status_code == 401
