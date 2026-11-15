# Backend

1. Copy `backend/.env.example` to `backend/.env` and fill it in (Supabase, JWT secret, CORS origins, WooCommerce keys, webhook secret).
2. Run the SQL files listed in the root README. The price tables start empty; the API fills them with the starting prices (and your numbers from the old tables) the first time it runs.
3. Start from the repo root: `backend/venv/Scripts/python -m uvicorn backend.main:app --port 8000` (docs at /docs).
4. Test from the repo root: `backend/venv/Scripts/python -m pytest backend/tests -q`.

Pricing lives in the `price_*` tables and is saved through one Postgres function, so a save is all or nothing and every save keeps a version. If the tables are missing the built in defaults are served and `/api/health` shows `pricing: "defaults"`. Records (`quote_sessions`, `uploads`, `orders`, `activity_log`) are skipped quietly until their tables exist.

For payment updates create a WooCommerce webhook: topic "Order updated", delivery URL `https://<your host>/api/woo/webhook`, secret equal to `WC_WEBHOOK_SECRET`. On a local machine use "Check payment" on an order instead.
