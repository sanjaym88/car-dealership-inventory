"""Request/response shapes for vehicles."""
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

# Text fields are trimmed; blank strings are rejected.
Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Price = Annotated[float, Field(gt=0)]
Quantity = Annotated[int, Field(ge=0)]


class VehicleCreate(BaseModel):
    make: Text
    model: Text
    category: Text
    price: Price
    quantity: Quantity


class VehicleUpdate(BaseModel):
    """Partial update: only the fields sent are changed."""

    make: Text | None = None
    model: Text | None = None
    category: Text | None = None
    price: Price | None = None
    quantity: Quantity | None = None


class RestockRequest(BaseModel):
    quantity: Annotated[int, Field(gt=0)]


class VehicleSearch(BaseModel):
    """Query parameters for /search. Every filter is optional; given filters are combined with AND."""

    make: str | None = None
    model: str | None = None
    category: str | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def check_price_range(self) -> "VehicleSearch":
        if self.min_price is not None and self.max_price is not None and self.min_price > self.max_price:
            raise ValueError("min_price must not be greater than max_price")
        return self


class VehicleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    price: float
    quantity: int
