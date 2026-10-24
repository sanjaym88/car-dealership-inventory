"""Reusable FastAPI dependencies that guard routes.

Use `Depends(get_current_user)` for any logged-in user and `Depends(require_admin)` for admin-only routes.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import InvalidTokenError, decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository

# auto_error=False so a missing header yields our 401 instead of FastAPI's default 403.
bearer_scheme = HTTPBearer(auto_error=False)


def unauthorized(detail: str) -> HTTPException:
    """401 with the WWW-Authenticate header the HTTP spec expects for bearer auth."""
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED, detail, headers={"WWW-Authenticate": "Bearer"}
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise unauthorized("Not authenticated")
    try:
        user_id = decode_access_token(credentials.credentials)
    except InvalidTokenError:
        raise unauthorized("Invalid or expired token") from None
    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise unauthorized("Invalid or expired token")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin privileges required")
    return user
