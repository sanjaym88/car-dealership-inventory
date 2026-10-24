"""HTTP layer for /api/vehicles. Every route needs a login; delete also needs admin."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.vehicle import VehicleCreate, VehicleRead, VehicleSearch, VehicleUpdate
from app.services.vehicle_service import VehicleNotFoundError, VehicleService

router = APIRouter(
    prefix="/api/vehicles", tags=["vehicles"], dependencies=[Depends(get_current_user)]
)


def get_vehicle_service(db: Session = Depends(get_db)) -> VehicleService:
    return VehicleService(VehicleRepository(db))


def not_found() -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")


@router.post("", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(data: VehicleCreate, service: VehicleService = Depends(get_vehicle_service)):
    return service.create(data)


@router.get("", response_model=list[VehicleRead])
def list_vehicles(service: VehicleService = Depends(get_vehicle_service)):
    return service.list_all()


@router.get("/search", response_model=list[VehicleRead])
def search_vehicles(
    criteria: Annotated[VehicleSearch, Query()],
    service: VehicleService = Depends(get_vehicle_service),
):
    return service.search(criteria)


@router.put("/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(
    vehicle_id: int, data: VehicleUpdate, service: VehicleService = Depends(get_vehicle_service)
):
    try:
        return service.update(vehicle_id, data)
    except VehicleNotFoundError:
        raise not_found()


@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_vehicle(vehicle_id: int, service: VehicleService = Depends(get_vehicle_service)):
    try:
        service.delete(vehicle_id)
    except VehicleNotFoundError:
        raise not_found()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
