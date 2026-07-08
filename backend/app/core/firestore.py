"""Firestore client provider — a single process-wide client."""
from __future__ import annotations

import json
import os
from functools import lru_cache

from google.cloud import firestore
from google.oauth2 import service_account

from app.core.config import get_settings


@lru_cache
def get_db() -> firestore.Client:
    """Return a cached Firestore client authenticated via the service account.

    ``GOOGLE_SERVICE_ACCOUNT_JSON`` may be either a filesystem path to the
    credentials file or the raw JSON contents (useful for container secrets).
    """
    settings = get_settings()
    raw = settings.google_service_account_json

    if os.path.isfile(raw):
        credentials = service_account.Credentials.from_service_account_file(raw)
    else:
        info = json.loads(raw)
        credentials = service_account.Credentials.from_service_account_info(info)

    return firestore.Client(
        project=settings.firestore_project_id,
        credentials=credentials,
        database=settings.firestore_database,
    )
