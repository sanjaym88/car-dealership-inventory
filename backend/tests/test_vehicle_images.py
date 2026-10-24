"""Vehicles can carry an optional photo URL, which orders keep a copy of."""

import pytest

PHOTO = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Camry.jpg/640px-Camry.jpg"


def test_image_is_optional(create_vehicle):
    assert create_vehicle()["image_url"] is None


def test_vehicle_keeps_its_image_url(client, user_headers, create_vehicle):
    vehicle = create_vehicle(image_url=PHOTO)

    listed = client.get("/api/vehicles", headers=user_headers).json()

    assert vehicle["image_url"] == PHOTO
    assert listed[0]["image_url"] == PHOTO


def test_image_url_can_be_updated(client, user_headers, create_vehicle):
    vehicle = create_vehicle()

    response = client.put(f"/api/vehicles/{vehicle['id']}", json={"image_url": PHOTO}, headers=user_headers)

    assert response.json()["image_url"] == PHOTO


@pytest.mark.parametrize(
    "bad_url",
    ["not a url", "ftp://example.com/car.jpg", "javascript:alert(1)", "https://" + "x" * 600],
)
def test_image_url_must_be_a_web_address(client, user_headers, bad_url):
    from tests.conftest import SAMPLE_VEHICLE

    response = client.post(
        "/api/vehicles", json={**SAMPLE_VEHICLE, "image_url": bad_url}, headers=user_headers
    )

    assert response.status_code == 422


def test_order_keeps_a_copy_of_the_photo(client, user_headers, create_vehicle):
    vehicle = create_vehicle(image_url=PHOTO)

    response = client.post(f"/api/vehicles/{vehicle['id']}/purchase", headers=user_headers)

    assert response.json()["order"]["image_url"] == PHOTO
