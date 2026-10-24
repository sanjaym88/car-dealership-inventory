"""Many buyers racing for the last few cars must never oversell.

Unlike the rest of the suite this test commits real data from separate connections, one per
buyer, all released at the same instant, so Postgres sees genuinely concurrent purchases.
"""

import threading

import pytest
from sqlalchemy import create_engine, delete, func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.order import Order
from app.models.user import User
from app.models.vehicle import Vehicle
from app.repositories.order_repository import OrderRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.order import CheckoutSelection
from app.services.order_service import OrderService
from app.services.vehicle_service import OutOfStockError
from tests.conftest import TEST_DATABASE_URL

BUYERS = 20
STOCK = 5


@pytest.fixture
def committed_stock():
    """A vehicle with STOCK units and BUYERS users, committed so every connection can see them."""
    engine = create_engine(TEST_DATABASE_URL, pool_size=BUYERS, max_overflow=0)
    with Session(engine, expire_on_commit=False) as db:
        vehicle = Vehicle(make="Porsche", model="911", category="Sports", price=120000, quantity=STOCK)
        users = [
            User(email=f"racer{i}@example.com", hashed_password=hash_password("secret123"))
            for i in range(BUYERS)
        ]
        db.add_all([vehicle, *users])
        db.commit()
    yield engine, vehicle, users
    with Session(engine) as db:
        db.execute(delete(Order).where(Order.user_id.in_([u.id for u in users])))
        db.execute(delete(Vehicle).where(Vehicle.id == vehicle.id))
        db.execute(delete(User).where(User.id.in_([u.id for u in users])))
        db.commit()
    engine.dispose()


def test_simultaneous_purchases_never_oversell(committed_stock):
    engine, vehicle, users = committed_stock
    start = threading.Barrier(BUYERS)
    outcomes: list[str] = []
    lock = threading.Lock()

    def buy(buyer: User) -> None:
        with Session(engine, expire_on_commit=False) as db:
            service = OrderService(VehicleRepository(db), OrderRepository(db))
            start.wait()  # release every buyer at once
            try:
                service.purchase(buyer, vehicle.id, CheckoutSelection())
                result = "bought"
            except OutOfStockError:
                db.rollback()
                result = "sold out"
        with lock:
            outcomes.append(result)

    threads = [threading.Thread(target=buy, args=(user,)) for user in users]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=30)

    with Session(engine) as db:
        stock_left = db.scalar(select(Vehicle.quantity).where(Vehicle.id == vehicle.id))
        orders = db.scalar(select(func.count()).select_from(Order).where(Order.vehicle_id == vehicle.id))

    assert outcomes.count("bought") == STOCK
    assert outcomes.count("sold out") == BUYERS - STOCK
    assert stock_left == 0
    assert orders == STOCK, "exactly one order per unit sold"
