"""Importing this package registers every model on Base.metadata (used by Alembic and tests)."""
from app.models.order import Order
from app.models.user import User
from app.models.vehicle import Vehicle

__all__ = ["Order", "User", "Vehicle"]
