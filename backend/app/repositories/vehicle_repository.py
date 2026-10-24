"""Database access for vehicles. Keeps SQL out of the service layer."""
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle


class VehicleRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> Sequence[Vehicle]:
        return self.db.scalars(select(Vehicle).order_by(Vehicle.id)).all()

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
