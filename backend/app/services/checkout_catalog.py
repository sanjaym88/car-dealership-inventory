"""The customisation a buyer can choose at checkout, with prices in USD.

This is the single source of truth for option prices: the client only sends option codes.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class Option:
    code: str
    label: str
    price: int
    description: str = ""


def _by_code(*options: Option) -> dict[str, Option]:
    return {option.code: option for option in options}


COLORS = _by_code(
    Option("arctic_white", "Arctic White", 0),
    Option("midnight_black", "Midnight Black", 0),
    Option("racing_red", "Racing Red", 500),
    Option("ocean_blue", "Ocean Blue", 500),
)

PACKAGES = _by_code(
    Option("standard", "Standard", 0, "Factory specification"),
    Option("premium", "Premium", 3500, "Leather seats and sunroof"),
    Option("sport", "Sport", 2800, "Alloy wheels and tuned suspension"),
)

ADDONS = _by_code(
    Option("extended_warranty", "Extended warranty (5 years)", 1200),
    Option("tinted_windows", "Tinted windows", 300),
    Option("all_weather_mats", "All-weather mats", 150),
    Option("ceramic_coating", "Ceramic coating", 900),
)

DELIVERY = _by_code(
    Option("pickup", "Pick up at dealership", 0),
    Option("home", "Home delivery", 250),
)

DEFAULT_COLOR = "arctic_white"
DEFAULT_PACKAGE = "standard"
DEFAULT_DELIVERY = "pickup"
