"""Authentication business rules, independent of HTTP."""

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate


class EmailAlreadyRegisteredError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class AuthService:
    def __init__(self, users: UserRepository):
        self.users = users

    def register(self, data: UserCreate) -> User:
        if self.users.get_by_email(data.email) is not None:
            raise EmailAlreadyRegisteredError
        user = User(email=data.email, hashed_password=hash_password(data.password), is_admin=False)
        return self.users.add(user)

    def create_admin(self, data: UserCreate) -> User:
        """Create an admin, or promote an existing user (their password is left unchanged)."""
        user = self.users.get_by_email(data.email)
        if user is None:
            user = User(email=data.email, hashed_password=hash_password(data.password))
        user.is_admin = True
        return self.users.add(user)

    def login(self, email: str, password: str) -> str:
        """Return an access token, or raise the same error for unknown email and wrong password."""
        user = self.users.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError
        return create_access_token(user.id)
