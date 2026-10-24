"""HTTP layer for checkout options and order history."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.user import User
from app.repositories.order_repository import OrderRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.order import AdminOrderRead, CheckoutOptions, OrderRead
from app.services.checkout_catalog import ADDONS, COLORS, DELIVERY, PACKAGES
from app.services.order_service import OrderService

router = APIRouter(prefix="/api", tags=["orders"])


def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(VehicleRepository(db), OrderRepository(db))


Service = Annotated[OrderService, Depends(get_order_service)]


@router.get(
    "/checkout/options", response_model=CheckoutOptions, dependencies=[Depends(get_current_user)]
)
def checkout_options():
    return CheckoutOptions(
        colors=list(COLORS.values()),
        packages=list(PACKAGES.values()),
        addons=list(ADDONS.values()),
        delivery=list(DELIVERY.values()),
    )


@router.get("/orders/me", response_model=list[OrderRead])
def my_orders(service: Service, user: User = Depends(get_current_user)):
    return service.orders_for(user)


@router.get("/orders", response_model=list[AdminOrderRead], dependencies=[Depends(require_admin)])
def all_orders(service: Service):
    return service.all_orders()
