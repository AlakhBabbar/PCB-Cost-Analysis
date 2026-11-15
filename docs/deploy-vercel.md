# Deploy on Vercel

Two Vercel projects from this one repository: the FastAPI backend and the React frontend. Each uses its own folder as the root, so there is nothing at the top of the repository for Vercel.

## Backend project
1. On vercel.com choose Add New, Project, import this repository, and set Root Directory to `backend`.
2. Leave the build settings alone. `backend/vercel.json` tells Vercel to run `main.py` as one Python function for every path, and `backend/requirements.txt` lists what to install.
3. Add the environment variables below, then deploy.

| Name | Needed | Note |
|---|---|---|
| `SUPABASE_URL` | yes | |
| `SUPABASE_SECRET_KEY` | yes | |
| `JWT_SECRET` | yes | long random string; changing it signs every admin out |
| `CORS_ORIGINS` | yes | the frontend address, for example `https://your-frontend.vercel.app`; several are separated by commas |
| `JWT_EXPIRES_HOURS` | no | default 168 |
| `WC_URL`, `WC_KEY`, `WC_SECRET`, `WC_PRODUCT_ID` | for ordering | without them the Order button answers "not set up yet" |
| `WC_WEBHOOK_SECRET` | for payment updates | webhook URL is `https://<backend address>/api/woo/webhook` |
| `GERBER_BUCKET` | no | default `gerbers` |

Check it with `https://<backend address>/api/health`.

## Frontend project
1. Add New, Project, import the same repository, and set Root Directory to `frontend`. Vercel picks the Vite preset by itself.
2. Add one environment variable: `VITE_API_URL` = the backend address, with no slash at the end.
3. Deploy. `frontend/vercel.json` sends every path to the app so links such as `/admin/orders` survive a refresh.

After the frontend has its address, put it in the backend's `CORS_ORIGINS` and redeploy the backend. Preview deployments get their own addresses; add those too if you want previews to reach the API.

## Branches
Pushes to `staging` deploy as previews. To make `staging` the main address of a project, set it as the Production Branch in that project's Git settings.

## How uploads work
Vercel refuses request bodies over 4.5 MB, so Gerber zips do not pass through the API. The browser asks the API for a one time upload link (`POST /api/gerber/upload-url`), sends the zip straight to the private Supabase bucket, then asks the API to read and check it (`POST /api/gerber/parse-upload`). The limit is 50 MB (`max_upload_mb`) and the bucket enforces it too. A file that fails the checks is removed. Set `DIRECT_UPLOAD=false` to send the zip through the API instead (`POST /api/gerber/parse`), which only makes sense on a host without the body limit.

## Limits to know
- A request may run for as long as the Vercel project allows (Settings, Functions). Reading a very large, complex zip can hit that limit.
- Rate limits and the 60 second price cache live in memory, so each running copy of the function keeps its own. Limits are looser than on one long running server.
- Staging uses whatever database and store the variables point at. With the live values, an order placed on staging is a real order.

## Why `backend/main.py` renames itself
The code imports itself as `backend.something`. When Vercel uses `backend/` as the root, the folder is no longer called `backend`, so `main.py` registers its own folder under that name before anything else is imported. Running locally from the repository root is unchanged.
