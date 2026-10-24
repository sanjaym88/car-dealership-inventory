"""Create an admin user, or promote an existing user to admin.

Usage (from backend/):
    python -m app.scripts.create_admin --email admin@example.com
The password is prompted for if --password is omitted, so it stays out of shell history.
"""

import argparse
import getpass
import sys
from collections.abc import Callable

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.repositories.user_repository import UserRepository
from app.schemas.user import AdminCreate
from app.services.auth_service import AuthService


def main(argv: list[str] | None = None, session_factory: Callable[[], Session] = SessionLocal) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", help="omit to be prompted")
    args = parser.parse_args(argv)
    password = args.password if args.password is not None else getpass.getpass("Password: ")

    try:
        data = AdminCreate(email=args.email, password=password)
    except ValidationError as exc:
        print(f"Invalid input: {exc}", file=sys.stderr)
        return 1

    db = session_factory()
    try:
        user = AuthService(UserRepository(db)).create_admin(data)
    finally:
        db.close()
    print(f"Admin ready: {user.email} (id {user.id})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
