"""Database access for orders."""
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, order: Order) -> Order:
        """Insert the order and commit. The commit also covers any stock change made earlier in
        the same session, so the stock decrement and the order are saved together or not at all."""
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def for_user(self, user_id: int) -> Sequence[Order]:
        query = select(Order).where(Order.user_id == user_id)
        return self._newest_first(query)

    def all(self) -> Sequence[Order]:
        return self._newest_first(select(Order).options(selectinload(Order.user)))

    def _newest_first(self, query) -> Sequence[Order]:
        # populate_existing: reload rows the database changed behind the ORM's back
        # (e.g. vehicle_id set to NULL by ON DELETE SET NULL).
        query = query.order_by(Order.created_at.desc(), Order.id.desc())
        return self.db.scalars(query.execution_options(populate_existing=True)).all()
