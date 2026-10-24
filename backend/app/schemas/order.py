"""Request/response shapes for checkout and orders."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.vehicle import VehicleRead
from app.services.checkout_catalog import (
    ADDONS,
    COLORS,
    DEFAULT_COLOR,
    DEFAULT_DELIVERY,
    DEFAULT_PACKAGE,
    DELIVERY,
    PACKAGES,
    Option,
)


def _known(code: str, catalog: dict[str, Option], what: str) -> str:
    if code not in catalog:
        raise ValueError(f"Unknown {what} '{code}'. Choose one of: {', '.join(catalog)}")
    return code


class CheckoutSelection(BaseModel):
    """What the buyer chose. Only option codes; any price sent by the client is ignored."""

    color: str = DEFAULT_COLOR
    package: str = DEFAULT_PACKAGE
    addons: list[str] = []
    delivery: str = DEFAULT_DELIVERY

    @field_validator("color")
    @classmethod
    def check_color(cls, code: str) -> str:
        return _known(code, COLORS, "colour")

    @field_validator("package")
    @classmethod
    def check_package(cls, code: str) -> str:
        return _known(code, PACKAGES, "package")

    @field_validator("addons")
    @classmethod
    def check_addons(cls, codes: list[str]) -> list[str]:
        unique = list(dict.fromkeys(codes))  # drop repeats, keep the buyer's order
        return [_known(code, ADDONS, "add-on") for code in unique]

    @field_validator("delivery")
    @classmethod
    def check_delivery(cls, code: str) -> str:
        return _known(code, DELIVERY, "delivery option")


class OptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    label: str
    price: int
    description: str


class CheckoutOptions(BaseModel):
    colors: list[OptionRead]
    packages: list[OptionRead]
    addons: list[OptionRead]
    delivery: list[OptionRead]


class LineItem(BaseModel):
    label: str
    price: float


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int | None
    make: str
    model: str
    category: str
    base_price: float
    color: str
    package: str
    addons: list[str]
    delivery: str
    line_items: list[LineItem]
    total_price: float
    created_at: datetime


class AdminOrderRead(OrderRead):
    buyer_email: str


class PurchaseResult(BaseModel):
    vehicle: VehicleRead
    order: OrderRead
