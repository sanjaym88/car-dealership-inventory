"""Request/response shapes for users. The password never appears in a response."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic_core import PydanticCustomError

from app.core import email_domain
from app.core.config import settings


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # bcrypt ignores bytes past 72

    @field_validator("email")
    @classmethod
    def domain_must_accept_mail(cls, email: str) -> str:
        # Looked up through the module so tests can replace the DNS check.
        if settings.check_email_domain and not email_domain.domain_accepts_mail(email):
            raise PydanticCustomError("email_domain", "This email's domain can't receive mail")
        return email


class AdminCreate(UserCreate):
    """Same rules as registration, minus the DNS check: whoever runs create_admin is trusted."""

    @field_validator("email")
    @classmethod
    def domain_must_accept_mail(cls, email: str) -> str:
        return email


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    is_admin: bool
