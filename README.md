# PCB Cost Analysis

Instant PCB quote page for buyers, with an admin panel for orders, abandoned checkouts, files and every pricing number and formula. Checkout and payment happen in WooCommerce.

## Layout
- `backend/` FastAPI. `core/` settings, auth, rate limit, Supabase and WooCommerce clients. `routers/` HTTP only. `services/pricing/` formula engine and config store. `services/records/` sessions, uploads, orders, activity. `services/gerber/` parser. `models/` pydantic. `tests/`.
- `frontend/` React + Vite. `features/quote/` buyer page. `features/admin/` admin panel (`shell`, `home`, `orders`, `leads`, `customers`, `files`, `pricing`, `settings`). `components/` ui, motion, art. `api/` fetch wrappers. `lib/` helpers.
- `docs/v2-spec.md` what the system does and why. `docs/pricing-model.md` the engine. `docs/api-contract.md` endpoints. `docs/frontend-kit.md` UI primitives.
- `supabase/migrations/` SQL to run in the Supabase SQL editor.
- `vercel.json`, `api/index.py`, `requirements.txt` deploy both parts as one Vercel project, see `docs/deploy-vercel.md`.

## Run
1. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`, fill them in.
2. In the Supabase SQL editor run `supabase/admin_users.sql` (new database only), then `supabase/migrations/002_pricing_v2.sql`, then `supabase/migrations/003_records.sql`. Each is safe to re-run.
3. Backend: `backend/venv/Scripts/python -m uvicorn backend.main:app --port 8000`
4. Frontend: `cd frontend && npm install && npm run dev`, open http://localhost:5173 (admin at /admin).
5. Sign up at `/admin/signup`, then approve yourself once: `backend/venv/Scripts/python backend/scripts/approve_admin.py you@example.com`. The first approved admin becomes the owner.
6. Tests: `backend/venv/Scripts/python -m pytest backend/tests -q`

Before step 2 the app still quotes and takes orders on built in starting prices; the admin Store page shows what is missing.
