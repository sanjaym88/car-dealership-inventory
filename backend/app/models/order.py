"""A completed purchase. Keeps a snapshot of the vehicle and prices, so history stays accurate
even if the vehicle is later edited or deleted."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import JSON, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.user import User


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # SET NULL: deleting a vehicle from the inventory must not erase anyone's purchase history.
    vehicle_id: Mapped[int | None] = mapped_column(ForeignKey("vehicles.id", ondelete="SET NULL"), index=True)
    make: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50))
    image_url: Mapped[str | None] = mapped_column(String(500))
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    color: Mapped[str] = mapped_column(String(50))
    package: Mapped[str] = mapped_column(String(50))
    addons: Mapped[list[str]] = mapped_column(JSON, default=list)
    delivery: Mapped[str] = mapped_column(String(50))
    line_items: Mapped[list[dict]] = mapped_column(JSON)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship()

    @property
    def buyer_email(self) -> str:
        return self.user.email
