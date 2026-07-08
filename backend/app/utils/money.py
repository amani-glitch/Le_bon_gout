"""Integer-cents money helpers (never use floats for money)."""
from __future__ import annotations


def format_cents(cents: int, *, symbol: str = "DT") -> str:
    # Tunisian dinar is written with the amount followed by "DT" (e.g. 12.50 DT).
    return f"{cents / 100:.2f} {symbol}"
