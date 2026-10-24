"""Authentication business rules, independent of HTTP."""
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate


class EmailAlreadyRegisteredError(Exception):
    pass


class AuthService:
    def __init__(self, users: UserRepository):
        self.users = users

    def register(self, data: UserCreate) -> User:
        if self.users.get_by_email(data.email) is not None:
            raise EmailAlreadyRegisteredError
        user = User(email=data.email, hashed_password=hash_password(data.password), is_admin=False)
        return self.users.add(user)
