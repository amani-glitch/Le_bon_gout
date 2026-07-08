"""Lead service — creates and lists B2B leads."""
from __future__ import annotations

from app.repositories.lead_repo import LeadRepository
from app.schemas.lead import Lead, LeadCreate, LeadSource, LeadStatus
from app.utils.ids import new_id


class LeadService:
    def __init__(self, repo: LeadRepository) -> None:
        self._repo = repo

    def create_lead(
        self,
        payload: LeadCreate,
        *,
        source: LeadSource,
        channel: str | None = None,
        conversation_id: str | None = None,
    ) -> Lead:
        now = self._repo.now()
        lead_id = new_id("lead")
        data = {
            "name": payload.name.strip(),
            "email": str(payload.email).strip(),
            "phone": payload.phone,
            "company": payload.company,
            "business_type": payload.business_type,
            "interest": payload.interest,
            "message": payload.message,
            "locale": payload.locale,
            "status": "new",
            "source": source,
            "channel": channel,
            "conversation_id": conversation_id,
            "created_at": now,
            "updated_at": now,
        }
        created = self._repo.create(lead_id, data)
        return Lead.model_validate(created)

    def list_admin(
        self, *, status: str | None, limit: int, cursor: str | None
    ) -> tuple[list[Lead], str | None]:
        items, next_cursor = self._repo.list_admin(status=status, limit=limit, cursor=cursor)
        return [Lead.model_validate(i) for i in items], next_cursor

    def update_status(self, lead_id: str, status: LeadStatus) -> Lead | None:
        updated = self._repo.update(lead_id, {"status": status})
        return Lead.model_validate(updated) if updated else None
