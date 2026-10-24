"""`python -m app.scripts.seed_inventory`: fills the showroom with a varied catalog of cars and photos."""

import httpx
from sqlalchemy import select

from app.models.vehicle import Vehicle
from app.scripts.seed_inventory import CATALOG, fetch_wikipedia_photo, main, seed


def fake_photo(title: str) -> str:
    return f"https://img.test/{title}.jpg"


def vehicles(db_session) -> list[Vehicle]:
    return list(db_session.scalars(select(Vehicle).order_by(Vehicle.id)))


# --- the catalog itself ---


def test_catalog_is_varied():
    categories = {car.category for car in CATALOG}
    assert len(CATALOG) >= 25
    assert len(categories) >= 8
    assert any(car.quantity == 0 for car in CATALOG), "include a sold-out car to show that state"
    assert len({(car.make, car.model) for car in CATALOG}) == len(CATALOG), "no duplicates"


# --- seeding ---


def test_seed_adds_every_catalog_car_with_its_photo(db_session):
    report = seed(db_session, fake_photo)

    cars = vehicles(db_session)
    assert report.created == len(CATALOG) == len(cars)
    camry = next(v for v in cars if (v.make, v.model) == ("Toyota", "Camry"))
    assert camry.image_url == "https://img.test/Toyota_Camry.jpg"


def test_seeding_twice_adds_nothing_new(db_session):
    seed(db_session, fake_photo)

    report = seed(db_session, fake_photo)

    assert report.created == 0
    assert len(vehicles(db_session)) == len(CATALOG)


def test_existing_cars_keep_their_details_but_gain_a_missing_photo(db_session):
    db_session.add(Vehicle(make="toyota", model="CAMRY", category="Sedan", price=1, quantity=99))
    db_session.commit()

    report = seed(db_session, fake_photo)

    camrys = [v for v in vehicles(db_session) if v.model.lower() == "camry"]
    assert len(camrys) == 1
    assert (camrys[0].price, camrys[0].quantity) == (1, 99)
    assert camrys[0].image_url == "https://img.test/Toyota_Camry.jpg"
    assert report.photos_added == 1


def test_existing_photos_are_not_replaced(db_session):
    db_session.add(
        Vehicle(
            make="Toyota",
            model="Camry",
            category="Sedan",
            price=1,
            quantity=1,
            image_url="https://mine.test/camry.jpg",
        )
    )
    db_session.commit()

    seed(db_session, fake_photo)

    camry = next(v for v in vehicles(db_session) if v.model == "Camry")
    assert camry.image_url == "https://mine.test/camry.jpg"


def test_cars_are_still_added_when_no_photo_is_found(db_session):
    seed(db_session, lambda title: None)

    assert all(v.image_url is None for v in vehicles(db_session))
    assert len(vehicles(db_session)) == len(CATALOG)


def test_main_without_photos_seeds_and_reports(db_session, capsys):
    exit_code = main(["--no-photos"], session_factory=lambda: db_session)

    assert exit_code == 0
    assert f"{len(CATALOG)} added" in capsys.readouterr().out


# --- looking up photos on Wikipedia ---


def wikipedia(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_photo_lookup_returns_a_500px_wikimedia_url_without_tracking_params():
    # Wikimedia only serves standard thumbnail widths (250, 330, 500, 960, 1280...); 640 returns 400.
    thumb = (
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/Camry.jpg/"
        "330px-Camry.jpg?utm_source=en.wikipedia.org"
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/rest_v1/page/summary/Toyota_Camry"
        # Wikimedia rejects requests without an identifying User-Agent that includes contact info.
        assert "github.com" in request.headers["User-Agent"]
        return httpx.Response(200, json={"thumbnail": {"source": thumb}})

    url = fetch_wikipedia_photo("Toyota_Camry", client=wikipedia(handler))

    assert url == "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/Camry.jpg/500px-Camry.jpg"


def test_photo_lookup_returns_none_for_missing_pages_or_images():
    assert fetch_wikipedia_photo("Nope", client=wikipedia(lambda r: httpx.Response(404))) is None
    assert fetch_wikipedia_photo("Nope", client=wikipedia(lambda r: httpx.Response(200, json={}))) is None


def test_photo_lookup_returns_none_when_offline():
    def handler(request):
        raise httpx.ConnectError("offline")

    assert fetch_wikipedia_photo("Toyota_Camry", client=wikipedia(handler)) is None
