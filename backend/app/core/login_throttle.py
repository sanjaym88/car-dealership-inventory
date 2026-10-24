"""Slows down password guessing: after too many wrong passwords for one email, logins for that
email are refused for a while, even with the right password.

Kept in memory, so it is per server process and resets on restart. That is enough for this
single-instance deployment; several instances would need a shared store such as Redis.
"""

import time
from collections.abc import Callable

MAX_FAILURES = 5
WINDOW_SECONDS = 15 * 60


class LoginThrottle:
    def __init__(self, clock: Callable[[], float] = time.monotonic):
        self.clock = clock
        self._failures: dict[str, list[float]] = {}

    def _recent(self, key: str) -> list[float]:
        cutoff = self.clock() - WINDOW_SECONDS
        recent = [t for t in self._failures.get(key, []) if t > cutoff]
        self._failures[key] = recent
        return recent

    def retry_after(self, key: str) -> int | None:
        """Seconds until this email may try again, or None if it isn't locked."""
        recent = self._recent(key)
        if len(recent) < MAX_FAILURES:
            return None
        return max(1, int(recent[0] + WINDOW_SECONDS - self.clock()))

    def record_failure(self, key: str) -> None:
        self._recent(key).append(self.clock())

    def reset(self, key: str) -> None:
        self._failures.pop(key, None)

    def clear(self) -> None:
        self._failures.clear()


login_throttle = LoginThrottle()
