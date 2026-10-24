"""Vehicle business rules, independent of HTTP."""
from collections.abc import Sequence

from app.models.vehicle import Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.vehicle import VehicleCreate, VehicleSearch, VehicleUpdate


class VehicleNotFoundError(Exception):
    pass


class OutOfStockError(Exception):
    pass


class VehicleService:
    def __init__(self, vehicles: VehicleRepository):
        self.vehicles = vehicles

    def create(self, data: VehicleCreate) -> Vehicle:
        return self.vehicles.save(Vehicle(**data.model_dump()))

    def list_all(self) -> Sequence[Vehicle]:
        return self.vehicles.list_all()

    def search(self, criteria: VehicleSearch) -> Sequence[Vehicle]:
        return self.vehicles.search(criteria)

    def get(self, vehicle_id: int) -> Vehicle:
        vehicle = self.vehicles.get(vehicle_id)
        if vehicle is None:
            raise VehicleNotFoundError
        return vehicle

    def update(self, vehicle_id: int, data: VehicleUpdate) -> Vehicle:
        vehicle = self.get(vehicle_id)
        # exclude_none: an explicit null is treated as "leave unchanged", never as "erase".
        for field, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
            setattr(vehicle, field, value)
        return self.vehicles.save(vehicle)

    def delete(self, vehicle_id: int) -> None:
        self.vehicles.delete(self.get(vehicle_id))

    def restock(self, vehicle_id: int, amount: int) -> Vehicle:
        vehicle = self.vehicles.increment_stock(vehicle_id, amount)
        if vehicle is None:
            raise VehicleNotFoundError
        return vehicle
