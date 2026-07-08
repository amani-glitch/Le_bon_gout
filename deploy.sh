#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Cloud Build + Cloud Run deployment for Botler Pizza
# Builds one container (React SPA served by the FastAPI backend)
# and deploys it as a single Cloud Run service.
# ============================================================

# --- Configuration (override via env) --------------------------
PROJECT_ID="${GCP_PROJECT_ID:-adp-413110}"
REGION="${GCP_REGION:-europe-west1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-le-bon-gout}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

cd "$(dirname "$0")"

# --- Pre-flight checks -----------------------------------------
command -v gcloud >/dev/null 2>&1 || { echo "ERROR: gcloud CLI not found." >&2; exit 1; }
[ -f service-account.json ] || { echo "ERROR: service-account.json missing." >&2; exit 1; }
[ -f .env ] || { echo "ERROR: .env missing." >&2; exit 1; }

echo "==> Setting GCP project to ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}" --quiet

# --- Build & push the image via Cloud Build --------------------
echo "==> Building image with Cloud Build (uses ./Dockerfile)..."
gcloud builds submit --tag "${IMAGE_NAME}" --timeout=900s .

# --- Load .env (handles comments / quoted values) --------------
echo "==> Loading .env..."
# `|| [ -n "$key" ]` ensures a final line without a trailing newline is still
# processed (otherwise the last .env entry is silently dropped).
while IFS='=' read -r key value || [ -n "$key" ]; do
  [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
  key="$(echo "$key" | xargs)"
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  export "$key=$value"
done < .env

# Service account JSON as a single line, passed inline (firestore.py accepts
# either a path or raw JSON). Comma-safe via the ^@@^ delimiter below.
SA_JSON="$(tr -d '\n' < service-account.json)"

# --- Deploy to Cloud Run ---------------------------------------
# First pass uses a placeholder redirect URI; we patch it with the real
# service URL once Cloud Run assigns one.
echo "==> Deploying to Cloud Run (${REGION})..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 900 \
  --min-instances 0 \
  --max-instances 4 \
  --set-env-vars "FIRESTORE_PROJECT_ID=${FIRESTORE_PROJECT_ID:-${PROJECT_ID}}" \
  --set-env-vars "FIRESTORE_DATABASE=${FIRESTORE_DATABASE:-lebongout}" \
  --set-env-vars "JWT_SECRET=${JWT_SECRET}" \
  --set-env-vars "JWT_ALGORITHM=${JWT_ALGORITHM:-HS256}" \
  --set-env-vars "JWT_EXPIRE_MINUTES=${JWT_EXPIRE_MINUTES:-1440}" \
  --set-env-vars "^##^ADMIN_EMAILS=${ADMIN_EMAILS}" \
  --set-env-vars "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" \
  --set-env-vars "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}" \
  --set-env-vars "STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}" \
  --set-env-vars "STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}" \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY:-}" \
  --set-env-vars "GEMINI_CHAT_MODEL=${GEMINI_CHAT_MODEL:-gemini-2.5-flash}" \
  --set-env-vars "GEMINI_LIVE_MODEL=${GEMINI_LIVE_MODEL:-gemini-3.1-flash-live-preview}" \
  --set-env-vars "GEMINI_VOICE=${GEMINI_VOICE:-Puck}" \
  --set-env-vars "CURRENCY=${CURRENCY:-gbp}" \
  --set-env-vars "DELIVERY_FEE_CENTS=${DELIVERY_FEE_CENTS:-299}" \
  --set-env-vars "COOKIE_SECURE=true" \
  --set-env-vars "GOOGLE_REDIRECT_URI=https://placeholder/auth/callback" \
  --set-env-vars "CORS_ORIGINS=https://placeholder" \
  --set-env-vars "^@@^GOOGLE_SERVICE_ACCOUNT_JSON=${SA_JSON}" \
  --quiet

# --- Patch redirect URI / CORS with the real service URL -------
SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" --format='value(status.url)')"

echo "==> Service URL: ${SERVICE_URL}"
echo "==> Patching GOOGLE_REDIRECT_URI and CORS_ORIGINS..."
gcloud run services update "${SERVICE_NAME}" \
  --region "${REGION}" \
  --update-env-vars "GOOGLE_REDIRECT_URI=${SERVICE_URL}/auth/callback" \
  --update-env-vars "CORS_ORIGINS=${SERVICE_URL}" \
  --quiet

cat <<EOF

==> Deployment complete!
    URL: ${SERVICE_URL}

==> Finish setup in the consoles:
    1. Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client:
       - Authorised redirect URI:     ${SERVICE_URL}/auth/callback
       - Authorised JavaScript origin: ${SERVICE_URL}
    2. Stripe Dashboard > Developers > Webhooks:
       - Endpoint: ${SERVICE_URL}/api/webhooks/stripe
       - Copy the signing secret into STRIPE_WEBHOOK_SECRET, then re-run:
         gcloud run services update ${SERVICE_NAME} --region ${REGION} \\
           --update-env-vars STRIPE_WEBHOOK_SECRET=whsec_xxx
    3. (Optional) Set a real Stripe publishable key in frontend/.env.production
       and redeploy to enable online card payments.
    4. Botler concierge (chat + voice): GEMINI_API_KEY must allow server-side
       calls. A browser key restricted to HTTP referrers will be rejected
       (403 API_KEY_HTTP_REFERRER_BLOCKED). Use an unrestricted key (or one
       scoped to the Generative Language API), then re-run:
         gcloud run services update ${SERVICE_NAME} --region ${REGION} \\
           --update-env-vars GEMINI_API_KEY=AIza...
EOF
