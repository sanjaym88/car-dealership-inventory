"""A vehicle model in the dealership's inventory; `quantity` is how many are in stock."""

from decimal import Decimal

from sqlalchemy import CheckConstraint, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"
    # The database enforces the same rules as the API, as a last line of defence.
    __table_args__ = (
        CheckConstraint("price > 0", name="ck_vehicles_price_positive"),
        CheckConstraint("quantity >= 0", name="ck_vehicles_quantity_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    make: Mapped[str] = mapped_column(String(100), index=True)
    model: Mapped[str] = mapped_column(String(100), index=True)
    category: Mapped[str] = mapped_column(String(50), index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str | None] = mapped_column(String(500))
