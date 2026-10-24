"""Request/response shapes for vehicles."""
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

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


class VehicleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    price: float
    quantity: int
