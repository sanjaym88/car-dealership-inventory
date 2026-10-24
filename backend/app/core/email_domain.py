"""Checks that an email's domain can actually receive mail (has MX or address records in DNS).

This catches typos and made-up domains such as someone@gmial.con. It cannot prove the mailbox
itself exists; only an emailed confirmation link can do that.
"""

from email_validator import EmailUndeliverableError, validate_email

DNS_TIMEOUT_SECONDS = 5


def domain_accepts_mail(email: str) -> bool:
    """False only when DNS says the domain takes no mail. If DNS itself can't be reached,
    email-validator lets the address through, so an outage never blocks sign-ups."""
    try:
        validate_email(email, check_deliverability=True, timeout=DNS_TIMEOUT_SECONDS)
    except EmailUndeliverableError:
        return False
    return True
