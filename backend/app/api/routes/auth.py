"""HTTP layer for /api/auth: translates requests to service calls and errors to status codes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, unauthorized
from app.core.database import get_db
from app.core.login_throttle import WINDOW_SECONDS, login_throttle
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import LoginRequest, Token, UserCreate, UserRead
from app.services.auth_service import (
    AuthService,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db))


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, service: AuthService = Depends(get_auth_service)):
    try:
        return service.register(data)
    except EmailAlreadyRegisteredError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered") from None


@router.post("/login", response_model=Token)
def login(data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    retry_after = login_throttle.retry_after(data.email)
    if retry_after is not None:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Too many failed attempts. Try again in {WINDOW_SECONDS // 60} minutes.",
            headers={"Retry-After": str(retry_after)},
        )
    try:
        token = service.login(data.email, data.password)
    except InvalidCredentialsError:
        login_throttle.record_failure(data.email)
        raise unauthorized("Invalid email or password") from None
    login_throttle.reset(data.email)
    return Token(access_token=token)


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user
