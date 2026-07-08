"""Stripe webhook — signature-verified, the source of truth for payment state."""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request

from app.api.deps import get_order_service, get_payment_service
from app.core.exceptions import PaymentError
from app.enums import PaymentStatus
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService

logger = logging.getLogger("botler")
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    payments: Annotated[PaymentService, Depends(get_payment_service)],
    orders: Annotated[OrderService, Depends(get_order_service)],
    stripe_signature: Annotated[str | None, Header(alias="Stripe-Signature")] = None,
) -> dict:
    payload = await request.body()  # raw bytes are required for signature verification
    if not stripe_signature:
        raise PaymentError("Missing Stripe signature header.")

    event = payments.construct_event(payload, stripe_signature)
    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "payment_intent.succeeded":
        orders.mark_paid_from_intent(obj["id"], obj.get("amount_received", obj["amount"]))
    elif event_type == "payment_intent.payment_failed":
        orders.mark_payment_status_from_intent(obj["id"], PaymentStatus.failed)
    elif event_type == "charge.refunded":
        intent_id = obj.get("payment_intent")
        if intent_id:
            orders.mark_payment_status_from_intent(intent_id, PaymentStatus.refunded)
    else:
        logger.info("Unhandled Stripe event: %s", event_type)

    return {"received": True}
