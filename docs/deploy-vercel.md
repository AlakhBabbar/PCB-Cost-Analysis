# Deploy on Vercel

One Vercel project serves both parts from the same address: the React app as static files and the FastAPI backend as one serverless function under `/api`. No CORS setup and no API address to configure.

## What makes it work
- `vercel.json` builds `frontend/` into `frontend/dist`, sends every `/api/...` request to `api/index.py`, and sends every other path to the React app.
- `api/index.py` hands Vercel the FastAPI app from `backend/main.py`.
- `requirements.txt` at the repo root points at `backend/requirements.txt`.
- A build without `VITE_API_URL` calls the API on its own address (`frontend/src/api/client.js`).

## Steps
1. On vercel.com choose Add New, Project, and import this GitHub repository.
2. Leave Root Directory as the repository root and Framework Preset as Other. The build settings come from `vercel.json`.
3. Add the environment variables below (Settings, Environment Variables) for Production and Preview.
4. Deploy. Pushes to `staging` then deploy on their own. To make `staging` the main address, set it as the Production Branch under Settings, Git (Settings, Environments on newer dashboards).

## Environment variables
Same names and values as `backend/.env`:

| Name | Needed | Note |
|---|---|---|
| `SUPABASE_URL` | yes | |
| `SUPABASE_SECRET_KEY` | yes | |
| `JWT_SECRET` | yes | long random string; changing it signs every admin out |
| `JWT_EXPIRES_HOURS` | no | default 168 |
| `WC_URL`, `WC_KEY`, `WC_SECRET`, `WC_PRODUCT_ID` | for ordering | without them the Order button answers "not set up yet" |
| `WC_WEBHOOK_SECRET` | for payment updates | webhook URL is `https://<your address>/api/woo/webhook` |
| `GERBER_BUCKET` | no | default `gerbers` |
| `CORS_ORIGINS` | no | not needed when both parts share one address |

Do not set `VITE_API_URL` unless the API lives at a different address.

## Limits to know
- Uploads: Vercel refuses request bodies over 4.5 MB, so on Vercel the Gerber limit is 4 MB (50 MB elsewhere). The page shows the limit it gets from the API.
- Time: a request may run for 60 seconds at most (`maxDuration` in `vercel.json`).
- Rate limits and the 60 second price cache live in memory, so each running copy of the function keeps its own. Limits are looser than on one long running server.
- Staging uses whatever database and store the variables point at. With the live values, an order placed on staging is a real order.
