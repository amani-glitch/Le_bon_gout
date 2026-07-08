"""B2B lead schemas — captured from the landing contact form or the sales bot."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.common import ApiModel

LeadInterest = Literal["basic", "custom", "unsure"]
LeadSource = Literal["contact_form", "bot_chat", "bot_voice"]
LeadStatus = Literal["new", "contacted", "won", "lost"]


class LeadCreate(ApiModel):
    """Public payload for the landing contact form (no auth)."""

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    company: str | None = Field(default=None, max_length=160)
    business_type: str | None = Field(default=None, max_length=120)
    interest: LeadInterest = "unsure"
    message: str | None = Field(default=None, max_length=4000)
    locale: str | None = Field(default=None, max_length=12)
    # Honeypot — must stay empty. Bots fill hidden fields; humans don't see it.
    company_website: str | None = Field(default=None, max_length=200)


class Lead(ApiModel):
    """Stored lead record (Firestore ``botler_pizza_leads``)."""

    id: str
    name: str
    email: EmailStr
    phone: str | None = None
    company: str | None = None
    business_type: str | None = None
    interest: LeadInterest = "unsure"
    message: str | None = None
    locale: str | None = None
    status: LeadStatus = "new"
    source: LeadSource = "contact_form"
    channel: str | None = None
    conversation_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class LeadStatusUpdate(ApiModel):
    status: LeadStatus
