"""Stripe payment service — PaymentIntent creation and webhook verification."""
from __future__ import annotations

import stripe

from app.core.config import Settings
from app.core.exceptions import PaymentError


class PaymentService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        stripe.api_key = settings.stripe_secret_key

    def create_payment_intent(
        self, *, order_id: str, user_id: str, amount_cents: int
    ) -> stripe.PaymentIntent:
        try:
            return stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=self._settings.currency,
                metadata={"order_id": order_id, "user_id": user_id},
                automatic_payment_methods={"enabled": True},
                idempotency_key=f"order_{order_id}",
            )
        except stripe.StripeError as exc:  # type: ignore[attr-defined]
            raise PaymentError("Could not initialise payment.", details=str(exc)) from exc

    def construct_event(self, payload: bytes, signature: str) -> stripe.Event:
        try:
            return stripe.Webhook.construct_event(
                payload, signature, self._settings.stripe_webhook_secret
            )
        except (ValueError, stripe.SignatureVerificationError) as exc:  # type: ignore[attr-defined]
            raise PaymentError("Invalid Stripe webhook signature.") from exc
