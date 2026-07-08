# 🍕 Botler Pizza

A full-stack pizza-ordering platform with a premium "butler service" aesthetic.
Customers browse a menu, customise pizzas (size + toppings), build a cart, pay
online (Stripe) **or** on delivery, track orders live, save favourites and manage
their profile. Admins manage orders, products, customers and metrics from a
dedicated dashboard.

| Layer    | Tech                                                   |
| -------- | ------------------------------------------------------ |
| Backend  | FastAPI · Firestore · Google OAuth2 · Stripe · PyJWT   |
| Frontend | React + Vite + TypeScript · Tailwind · TanStack Query · Zustand · Framer Motion · Radix |
| Auth     | Google OAuth2 (code brokered by backend → JWT in an httpOnly cookie) |
| Payments | Stripe PaymentIntents (online optional; cash on delivery supported) |

---

## ⚠️ Secrets

`.env` and `service-account.json` hold live credentials and are **gitignored**.
Because they were shared during development, **rotate them** before going to
production: the Stripe secret key, Google OAuth client secret, and the service
account private key.

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Google Cloud service account with Firestore access (provided as
  `service-account.json`, project `adp-413110`)
- A Google OAuth 2.0 Client with `http://localhost:5173/auth/callback` as an
  authorised redirect URI
- (Optional) A Stripe test account for online payments

## Environment

Root `.env` (already present) powers the backend. Key values added during setup:
`JWT_SECRET`, `ADMIN_EMAILS` (emails granted the admin role on first login),
`CORS_ORIGINS`, `DELIVERY_FEE_CENTS`. The frontend reads `frontend/.env.local`
(`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`).

> To enable online payment, set a real `pk_test_...` in
> `frontend/.env.local`. Without it, checkout still works via "pay on delivery".

---

## Run the backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"

# Seed the Firestore menu (categories + sample pizzas) — run once
.venv/bin/python -m scripts.seed

# Start the API (http://localhost:8000, docs at /docs)
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Run the tests:

```bash
cd backend && .venv/bin/python -m pytest
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Open http://localhost:5173 and sign in with Google. The email listed in
`ADMIN_EMAILS` lands with the **admin** role and sees the admin dashboard link
in the account menu.

---

## Stripe webhook (for online payments)

The webhook is the source of truth for marking orders paid. Forward events to
the backend in a separate terminal:

```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
# test with card 4242 4242 4242 4242, any future expiry / CVC
```

Set `STRIPE_WEBHOOK_SECRET` in `.env` to the signing secret printed by
`stripe listen`.

---

## Architecture

```
botler_pizza/
├── backend/                 FastAPI — layered router → service → repository
│   ├── app/
│   │   ├── core/            config, firestore client, security (JWT), errors
│   │   ├── schemas/         Pydantic contracts (separate Create/Update/response)
│   │   ├── repositories/    Firestore data access only
│   │   ├── services/        business logic & invariants
│   │   └── api/             deps (DI) + routers (auth, products, cart, orders,
│   │                        favorites, profile, webhooks, admin/*)
│   ├── scripts/seed.py      sample menu
│   └── tests/               unit tests (pricing, cart, order lifecycle)
└── frontend/                React (feature-first)
    └── src/
        ├── app/             providers, router + guards, env config
        ├── layouts/         Public / App (customer) / Admin (navy sidebar)
        ├── features/        auth, menu, cart, checkout, orders, favorites,
        │                    profile, admin, landing
        ├── components/      ui (Button, Dialog, Input…) + brand (Logo, AmberOrb…)
        └── styles/          design tokens (light/dark CSS variables)
```

### Data model (Firestore)

`users/{sub}` · `categories/{slug}` · `products/{id}` · `carts/{userId}` ·
`orders/{ulid}` (line items snapshotted; status + payment lifecycle) ·
`favorites/{userId}/items/{id}`. Money is stored as integer cents throughout.

Deploy the composite indexes in `backend/firestore.indexes.json` before running
admin/customer order queries at scale.

### Design

Dark-mode-first. Brand navy (`#1E2A6B`) + warm amber (`#F0B852`) from the Botler
logo, elegant Fraunces serif headings, Inter body. Theme is class-based with an
inline pre-paint script (no flash). Toggle persists per device.
