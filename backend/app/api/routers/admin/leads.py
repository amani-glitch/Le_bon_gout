"""Admin B2B lead management — list and update status."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import AdminDep, get_lead_service
from app.core.exceptions import NotFoundError
from app.schemas.common import Page
from app.schemas.lead import Lead, LeadStatusUpdate
from app.services.lead_service import LeadService

router = APIRouter(prefix="/admin/leads", tags=["admin:leads"])


@router.get("", response_model=Page[Lead])
def list_leads(
    admin: AdminDep,
    leads: Annotated[LeadService, Depends(get_lead_service)],
    status: str | None = None,
    limit: int = 25,
    cursor: str | None = None,
) -> Page[Lead]:
    items, next_cursor = leads.list_admin(status=status, limit=limit, cursor=cursor)
    return Page(items=items, next_cursor=next_cursor, has_more=next_cursor is not None)


@router.patch("/{lead_id}", response_model=Lead)
def update_lead_status(
    lead_id: str,
    payload: LeadStatusUpdate,
    admin: AdminDep,
    leads: Annotated[LeadService, Depends(get_lead_service)],
) -> Lead:
    lead = leads.update_status(lead_id, payload.status)
    if lead is None:
        raise NotFoundError("Lead not found.")
    return lead
