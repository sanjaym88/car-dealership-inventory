"""Buying a vehicle: take it out of stock, price the chosen options, record the order."""
from collections.abc import Sequence
from decimal import Decimal

from app.models.order import Order
from app.models.user import User
from app.models.vehicle import Vehicle
from app.repositories.order_repository import OrderRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.order import CheckoutSelection
from app.services.checkout_catalog import ADDONS, COLORS, DELIVERY, PACKAGES
from app.services.vehicle_service import OutOfStockError, VehicleNotFoundError


def build_line_items(vehicle: Vehicle, selection: CheckoutSelection) -> list[dict]:
    """The receipt: base price first, then every chosen option, all priced from the catalog."""
    items = [
        (f"{vehicle.make} {vehicle.model} (base price)", vehicle.price),
        (f"Paint: {COLORS[selection.color].label}", COLORS[selection.color].price),
        (f"Package: {PACKAGES[selection.package].label}", PACKAGES[selection.package].price),
        *((f"Add-on: {ADDONS[code].label}", ADDONS[code].price) for code in selection.addons),
        (f"Delivery: {DELIVERY[selection.delivery].label}", DELIVERY[selection.delivery].price),
    ]
    return [{"label": label, "price": float(price)} for label, price in items]


class OrderService:
    def __init__(self, vehicles: VehicleRepository, orders: OrderRepository):
        self.vehicles = vehicles
        self.orders = orders

    def purchase(self, buyer: User, vehicle_id: int, selection: CheckoutSelection) -> tuple[Vehicle, Order]:
        vehicle = self.vehicles.take_one_unit(vehicle_id)
        if vehicle is None:
            # Nothing was updated: tell apart "no such vehicle" from "none left".
            if self.vehicles.get(vehicle_id) is None:
                raise VehicleNotFoundError
            raise OutOfStockError

        line_items = build_line_items(vehicle, selection)
        order = Order(
            user_id=buyer.id,
            vehicle_id=vehicle.id,
            make=vehicle.make,
            model=vehicle.model,
            category=vehicle.category,
            base_price=vehicle.price,
            color=selection.color,
            package=selection.package,
            addons=selection.addons,
            delivery=selection.delivery,
            line_items=line_items,
            total_price=sum((Decimal(str(item["price"])) for item in line_items), Decimal(0)),
        )
        # One commit for both the stock change and the order.
        return vehicle, self.orders.add(order)

    def orders_for(self, user: User) -> Sequence[Order]:
        return self.orders.for_user(user.id)

    def all_orders(self) -> Sequence[Order]:
        return self.orders.all()
