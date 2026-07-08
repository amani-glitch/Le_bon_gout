"""Domain exception hierarchy mapped to HTTP responses by error_handlers."""
from __future__ import annotations

from typing import Any


class AppError(Exception):
    """Base application error. Carries an HTTP status, machine code and message."""

    status_code: int = 400
    code: str = "app_error"

    def __init__(self, message: str, *, details: Any | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"


class UnauthorizedError(AppError):
    status_code = 401
    code = "unauthorized"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"


class PaymentError(AppError):
    status_code = 402
    code = "payment_error"


class AuthError(AppError):
    status_code = 401
    code = "auth_error"
