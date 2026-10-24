"""HTTP layer for /api/vehicles. Every route needs a login; delete and restock also need admin.

Service errors (not found, out of stock) become HTTP responses in app/api/errors.py.
"""

from typing import Annotated

from fastapi import APIRouter, Body, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.api.routes.orders import get_order_service
from app.core.database import get_db
from app.models.user import User
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.order import CheckoutSelection, PurchaseResult
from app.schemas.vehicle import (
    RestockRequest,
    VehicleCreate,
    VehicleRead,
    VehicleSearch,
    VehicleUpdate,
)
from app.services.order_service import OrderService
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"], dependencies=[Depends(get_current_user)])


def get_vehicle_service(db: Session = Depends(get_db)) -> VehicleService:
    return VehicleService(VehicleRepository(db))


Service = Annotated[VehicleService, Depends(get_vehicle_service)]


@router.post("", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(data: VehicleCreate, service: Service):
    return service.create(data)


@router.get("", response_model=list[VehicleRead])
def list_vehicles(service: Service):
    return service.list_all()


@router.get("/search", response_model=list[VehicleRead])
def search_vehicles(criteria: Annotated[VehicleSearch, Query()], service: Service):
    return service.search(criteria)


@router.put("/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(vehicle_id: int, data: VehicleUpdate, service: Service):
    return service.update(vehicle_id, data)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_vehicle(vehicle_id: int, service: Service):
    service.delete(vehicle_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{vehicle_id}/purchase", response_model=PurchaseResult)
def purchase_vehicle(
    vehicle_id: int,
    orders: Annotated[OrderService, Depends(get_order_service)],
    user: User = Depends(get_current_user),
    selection: Annotated[CheckoutSelection | None, Body()] = None,
):
    """Buy one unit. The body (customisation) is optional; without it the defaults apply."""
    vehicle, order = orders.purchase(user, vehicle_id, selection or CheckoutSelection())
    return PurchaseResult(vehicle=vehicle, order=order)


@router.post("/{vehicle_id}/restock", response_model=VehicleRead, dependencies=[Depends(require_admin)])
def restock_vehicle(vehicle_id: int, data: RestockRequest, service: Service):
    return service.restock(vehicle_id, data.quantity)
