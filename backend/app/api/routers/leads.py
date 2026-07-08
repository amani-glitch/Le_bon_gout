"""Public B2B lead capture — the landing-page contact form posts here."""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_lead_service
from app.schemas.lead import Lead, LeadCreate
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["leads"])
logger = logging.getLogger("botler.leads")


@router.post("", response_model=Lead)
def create_lead(
    payload: LeadCreate,
    leads: Annotated[LeadService, Depends(get_lead_service)],
) -> Lead:
    # Honeypot: real users never see/fill ``company_website``. Bots that auto-fill
    # every field trip it — we drop the submission but answer 200 so they don't retry.
    if payload.company_website:
        logger.info("Dropped honeypot lead submission from %s", payload.email)
        return Lead(id="_", name=payload.name, email=payload.email)
    return leads.create_lead(payload, source="contact_form")
