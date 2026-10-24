"""HTTP layer for /api/auth: translates requests to service calls and errors to status codes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, unauthorized
from app.core.database import get_db
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
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")


@router.post("/login", response_model=Token)
def login(data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    try:
        return Token(access_token=service.login(data.email, data.password))
    except InvalidCredentialsError:
        raise unauthorized("Invalid email or password")


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user
