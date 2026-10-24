"""Database access for vehicles. Keeps SQL out of the service layer."""
from collections.abc import Sequence

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleSearch


class VehicleRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> Sequence[Vehicle]:
        return self.db.scalars(select(Vehicle).order_by(Vehicle.id)).all()

    def search(self, criteria: VehicleSearch) -> Sequence[Vehicle]:
        query = select(Vehicle).order_by(Vehicle.id)
        # autoescape: user-typed % and _ are matched literally, not as SQL wildcards.
        if criteria.make:
            query = query.where(Vehicle.make.icontains(criteria.make, autoescape=True))
        if criteria.model:
            query = query.where(Vehicle.model.icontains(criteria.model, autoescape=True))
        if criteria.category:
            query = query.where(func.lower(Vehicle.category) == criteria.category.lower())
        if criteria.min_price is not None:
            query = query.where(Vehicle.price >= criteria.min_price)
        if criteria.max_price is not None:
            query = query.where(Vehicle.price <= criteria.max_price)
        return self.db.scalars(query).all()

    def get(self, vehicle_id: int) -> Vehicle | None:
        return self.db.get(Vehicle, vehicle_id)

    def save(self, vehicle: Vehicle) -> Vehicle:
        """Insert or update, then reload so generated values (like id) are populated."""
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def delete(self, vehicle: Vehicle) -> None:
        self.db.delete(vehicle)
        self.db.commit()

    def decrement_stock(self, vehicle_id: int) -> Vehicle | None:
        """Take one unit out of stock in a single UPDATE, so concurrent purchases can't oversell.

        Returns the updated vehicle, or None if it doesn't exist or is already out of stock.
        """
        statement = (
            update(Vehicle)
            .where(Vehicle.id == vehicle_id, Vehicle.quantity > 0)
            .values(quantity=Vehicle.quantity - 1)
        )
        return self._apply_stock_change(vehicle_id, statement)

    def increment_stock(self, vehicle_id: int, amount: int) -> Vehicle | None:
        """Add units in a single UPDATE. Returns the updated vehicle, or None if it doesn't exist."""
        statement = (
            update(Vehicle)
            .where(Vehicle.id == vehicle_id)
            .values(quantity=Vehicle.quantity + amount)
        )
        return self._apply_stock_change(vehicle_id, statement)

    def _apply_stock_change(self, vehicle_id: int, statement) -> Vehicle | None:
        changed = self.db.execute(statement.execution_options(synchronize_session=False)).rowcount
        self.db.commit()
        if changed == 0:
            return None
        return self.db.get(Vehicle, vehicle_id, populate_existing=True)
