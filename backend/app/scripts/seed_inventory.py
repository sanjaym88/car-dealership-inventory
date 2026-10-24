"""Fill the inventory with a varied catalog of cars, each with a photo from its Wikipedia article.

Usage (from backend/):
    python -m app.scripts.seed_inventory              # look up photos on Wikipedia
    python -m app.scripts.seed_inventory --no-photos  # offline: cars only

Safe to run repeatedly: cars that already exist (same make and model) keep their price and stock,
and only gain a photo if they have none. Photos are Wikimedia Commons images, used under their
free licences and credited in the README.
"""

import argparse
import re
import sys
from collections.abc import Callable
from dataclasses import dataclass

import httpx
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.vehicle import Vehicle

# Wikimedia's API policy requires a descriptive User-Agent with contact details.
USER_AGENT = "car-dealership-kata/1.0 (https://github.com/sanjaym88/car-dealership-inventory)"
SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
# Must be one of Wikimedia's standard thumbnail widths (250, 330, 500, 960, 1280); others return 400.
PHOTO_WIDTH = 500

PhotoLookup = Callable[[str], str | None]


@dataclass(frozen=True)
class CatalogCar:
    make: str
    model: str
    category: str
    price: float
    quantity: int
    wikipedia_title: str


CATALOG = [
    CatalogCar("Toyota", "Camry", "Sedan", 28400, 6, "Toyota_Camry"),
    CatalogCar("Honda", "Civic", "Sedan", 24650, 8, "Honda_Civic"),
    CatalogCar("BMW", "3 Series", "Luxury", 46900, 3, "BMW_3_Series"),
    CatalogCar("Mercedes-Benz", "E-Class", "Luxury", 62250, 2, "Mercedes-Benz_E-Class"),
    CatalogCar("Lexus", "RX", "Luxury", 50500, 2, "Lexus_RX"),
    CatalogCar("Toyota", "RAV4", "SUV", 30500, 5, "Toyota_RAV4"),
    CatalogCar("Honda", "CR-V", "SUV", 31450, 6, "Honda_CR-V"),
    CatalogCar("Ford", "Explorer", "SUV", 39900, 3, "Ford_Explorer"),
    CatalogCar("Jeep", "Wrangler", "SUV", 33900, 4, "Jeep_Wrangler"),
    CatalogCar("Audi", "Q5", "SUV", 47100, 2, "Audi_Q5"),
    CatalogCar("Volvo", "XC90", "SUV", 58900, 1, "Volvo_XC90"),
    CatalogCar("Ford", "F-150", "Truck", 38800, 5, "Ford_F-150"),
    CatalogCar("Chevrolet", "Silverado", "Truck", 37600, 4, "Chevrolet_Silverado"),
    CatalogCar("Ram", "1500", "Truck", 41000, 3, "Ram_pickup"),
    CatalogCar("Toyota", "Tacoma", "Truck", 32500, 0, "Toyota_Tacoma"),
    CatalogCar("Tesla", "Model 3", "Electric", 38990, 5, "Tesla_Model_3"),
    CatalogCar("Tesla", "Model Y", "Electric", 44990, 4, "Tesla_Model_Y"),
    CatalogCar("Hyundai", "Ioniq 5", "Electric", 42600, 3, "Hyundai_Ioniq_5"),
    CatalogCar("Kia", "EV6", "Electric", 42900, 2, "Kia_EV6"),
    CatalogCar("Nissan", "Leaf", "Electric", 29280, 0, "Nissan_Leaf"),
    CatalogCar("Volkswagen", "Golf", "Hatchback", 29500, 4, "Volkswagen_Golf"),
    CatalogCar("Toyota", "Prius", "Hatchback", 28350, 6, "Toyota_Prius"),
    CatalogCar("Mini", "Cooper", "Hatchback", 29400, 2, "Mini_Hatch"),
    CatalogCar("Mazda", "MX-5 Miata", "Convertible", 29930, 3, "Mazda_MX-5"),
    CatalogCar("Ford", "Mustang", "Coupe", 32515, 4, "Ford_Mustang"),
    CatalogCar("Porsche", "911", "Sports", 122095, 1, "Porsche_911"),
    CatalogCar("Chevrolet", "Corvette", "Sports", 69995, 1, "Chevrolet_Corvette"),
    CatalogCar("Honda", "Odyssey", "Minivan", 41110, 3, "Honda_Odyssey_(North_America)"),
    CatalogCar("Chrysler", "Pacifica", "Minivan", 43490, 2, "Chrysler_Pacifica_(minivan)"),
    CatalogCar("Subaru", "Outback", "Wagon", 30210, 4, "Subaru_Outback"),
]


def fetch_wikipedia_photo(title: str, client: httpx.Client | None = None) -> str | None:
    """URL of the lead photo of a Wikipedia article, resized to PHOTO_WIDTH; None if unavailable."""
    client = client or httpx.Client(follow_redirects=True, timeout=10)
    try:
        response = client.get(SUMMARY_URL.format(title=title), headers={"User-Agent": USER_AGENT})
        if response.status_code != 200:
            return None
        source = (response.json().get("thumbnail") or {}).get("source")
    except (httpx.HTTPError, ValueError):
        return None
    if not source:
        return None
    # Drop tracking parameters and ask Wikimedia for a larger standard thumbnail size.
    return re.sub(r"/\d+px-", f"/{PHOTO_WIDTH}px-", source.split("?")[0])


@dataclass
class SeedReport:
    created: int = 0
    photos_added: int = 0
    unchanged: int = 0


def _find(db: Session, make: str, model: str) -> Vehicle | None:
    query = select(Vehicle).where(
        func.lower(Vehicle.make) == make.lower(), func.lower(Vehicle.model) == model.lower()
    )
    return db.scalars(query).first()


def seed(db: Session, photo_lookup: PhotoLookup) -> SeedReport:
    report = SeedReport()
    for car in CATALOG:
        existing = _find(db, car.make, car.model)
        if existing is None:
            db.add(
                Vehicle(
                    make=car.make,
                    model=car.model,
                    category=car.category,
                    price=car.price,
                    quantity=car.quantity,
                    image_url=photo_lookup(car.wikipedia_title),
                )
            )
            report.created += 1
        elif existing.image_url is None and (photo := photo_lookup(car.wikipedia_title)):
            existing.image_url = photo
            report.photos_added += 1
        else:
            report.unchanged += 1
    db.commit()
    return report


def main(argv: list[str] | None = None, session_factory: Callable[[], Session] = SessionLocal) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--no-photos", action="store_true", help="skip the Wikipedia photo lookup")
    args = parser.parse_args(argv)

    if args.no_photos:
        lookup: PhotoLookup = lambda title: None  # noqa: E731
    else:
        client = httpx.Client(follow_redirects=True, timeout=10)
        lookup = lambda title: fetch_wikipedia_photo(title, client)  # noqa: E731

    db = session_factory()
    try:
        report = seed(db, lookup)
    finally:
        db.close()
    print(
        f"Inventory seeded: {report.created} added, {report.photos_added} photos added "
        f"to existing cars, {report.unchanged} unchanged."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
