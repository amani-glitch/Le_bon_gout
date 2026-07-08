"""Admin dashboard metrics."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import AdminDep, get_metrics_service
from app.schemas.metrics import DashboardMetrics
from app.services.metrics_service import MetricsService

router = APIRouter(prefix="/admin", tags=["admin:metrics"])


@router.get("/metrics", response_model=DashboardMetrics)
def dashboard(
    admin: AdminDep,
    metrics: Annotated[MetricsService, Depends(get_metrics_service)],
) -> DashboardMetrics:
    return metrics.dashboard()
