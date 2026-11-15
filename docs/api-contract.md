# API contract (v2)

Base URL from `VITE_API_URL` (default http://127.0.0.1:8000). JSON is camelCase. Errors are `{ "detail": "message" }`; validation errors are FastAPI's standard 422 `{ "detail": [{ "loc": ["body", "customer", "email"], "msg": "..." }] }`. Supabase failures answer 502, WooCommerce failures 502.

Rate limits per client IP (429 `"Too many requests. Please wait a minute."`): quote 120/min, parse 10/min, checkout 30/min, order 5/min, sign in 10/min, sign up 5/hour.

The browser makes a session id (uuid in localStorage) and sends it as header `X-Session-Id` on quote, parse, checkout and order. A missing or malformed id is ignored (no tracking), except on checkout where it is required.

## Public

### GET /api/health
`{ "ok": true, "pricing": "ok" | "defaults" }` (`defaults` means the pricing tables are not set up and the built in defaults are served).

### GET /api/pricing/options
Option lists for the quote form, built from the pricing config.

### POST /api/quote
Body: QuoteRequest
```json
{ "boardW": 130, "boardL": 80, "quantity": 275, "layers": "2", "orderType": "Bare PCB", "thickness": "1.6",
  "copper": "1", "material": "FR4 TG130", "maskColor": "Green", "silkscreen": "White", "finish": "HASL-LF",
  "traceSpace": "6/6", "minHole": "0.30", "ipcStd": "IPC-2", "testing": "FlyingProbe", "express": "Standard",
  "specials": { "impedance": false } }
```
Response:
```json
{ "pricePerBoard": 73.11, "quantity": 275, "engFee": 0, "subtotal": 20105.25, "gstPct": 18, "gst": 3618.95,
  "total": 23724.2, "delivery": "7-10 working days",
  "summary": { "Order type": "Bare PCB", "Board": "130 x 80 mm", "Layers": "2", "Material": "FR4 TG130", "Silkscreen": "White", "...": "..." },
  "manual": false, "manualReason": null }
```
422 with the rule message when the board is blocked. `manual: true` means no price; send a quote request through `/api/checkout` with `kind: "manual"`. In the background the session is saved with stage `quoted` (a later stage is never lowered).

### POST /api/gerber/upload-url
Step 1 of direct upload. Body `{ "filename": "board.zip", "size": 123456 }`. Answers `{ "uploadId", "url" }`; the browser sends the zip with `PUT url` and header `Content-Type: application/zip`. The link works once. 400 when the name is not a .zip, 413 over the limit, 503 when storage is unreachable, 404 when `DIRECT_UPLOAD` is off.

### POST /api/gerber/parse-upload
Step 2. Body `{ "uploadId", "filename" }`, header `X-Session-Id`. Reads the zip from storage, checks and parses it. Same answer as `/api/gerber/parse`. 404 when the upload is not in storage; a zip that fails the checks is removed and answers 400 or 413.

### POST /api/gerber/parse (multipart, field `file`, .zip only, max 50 MB)
The zip is inspected first (max 500 entries, max 250 MB unpacked, no absolute or parent paths): 400 with a plain message otherwise. Response is ParsedGerberResult (backend/models/gerber.py) plus:
```json
{ "uploadId": "uuid" | null, "ok": true }
```
`ok` is false when `errors` is not empty or there are no dimensions. If the file could not be saved, `uploadId` is null and `errors` says so. Only an `ok` upload can be ordered.

### POST /api/checkout (204)
```json
{ "kind": "checkout" | "manual",
  "contact": { "firstName": "", "lastName": "", "email": "", "phone": "", "company": "" },
  "note": "optional", "quote": { "...QuoteRequest": "optional" } }
```
All contact fields optional; email and phone are validated when given. Requires `X-Session-Id` (400 otherwise). Sets the session stage to `checkout_started` or `manual_requested`.

### POST /api/order
```json
{ "uploadId": "uuid", "quote": { "...QuoteRequest": "" },
  "customer": { "firstName": "Asha", "lastName": "Rao", "email": "a@x.com", "phone": "9876543210",
                "company": "optional", "gstin": "optional, 15 chars",
                "address1": "12 MG Road", "address2": "", "city": "Agra", "state": "UP", "postcode": "282005", "note": "" } }
```
Response `{ "orderId": 6412, "paymentUrl": "https://shop/checkout/order-pay/..." }` (`orderId` is the WooCommerce order id).
The price is recomputed on the server. 503 when WooCommerce is not configured, 422 when the quote is `manual`, the board is blocked, or the stored file could not be read. Typed specs that disagree with the parsed file (size beyond 2 mm, copper layers, smallest hole) do not reject; the order gets `needsReview` with plain reasons. Every summary entry is shown on the WooCommerce line item; company goes to billing, GSTIN and company to order meta. The order note says the file is in the admin panel (no link).

### POST /api/woo/webhook
WooCommerce webhook, topic "Order updated". Header `X-WC-Webhook-Signature` must be the base64 HMAC SHA256 of the raw body with `WC_WEBHOOK_SECRET` (401 otherwise, 503 when the secret is not set). The creation ping (`webhook_id=...`, form encoded) answers 200. Unknown order ids answer `{ "ok": true, "handled": false }`.
Status map: `processing`, `completed` -> `paid`; `pending`, `on-hold` -> `pending`; `failed`, `refunded`, `cancelled` -> same.

## Auth

Backend issues its own HS256 JWT (`JWT_SECRET`, `JWT_EXPIRES_HOURS`, default 168). Send `Authorization: Bearer <token>`. Admin routes answer 401 when the token is missing, invalid, expired, or the user is not approved or gone; 403 `"Your role cannot do this"` when the role is too low.

### POST /api/auth/signup (201)
`{ "name", "phone" (min 5), "email", "password" (min 8), "note"? }` -> `{ "status": "pending" }`. 409 when the email exists.

### POST /api/auth/signin
`{ "email", "password" }` -> `{ "token", "user": { "id", "name", "email", "role" } }`. 401 `"Invalid email or password"`, 403 `"pending"`.

### GET /api/auth/me
`{ "id", "name", "email", "phone", "status", "role" }`.

Roles: `staff` (sales), `manager` (sales and pricing), `owner` (everything). Before `003_records.sql` runs there is no role column and every approved admin counts as `owner`.

## Admin: sales (staff and up)

Records endpoints need `supabase/migrations/003_records.sql`. Before it runs, lists answer `{ "items": [], "total": 0, "ready": false }`, summary answers `ready: false`, and detail or write endpoints answer 503 with the setup message.

Lists take `page` (from 1), `size` (default 25, max 100) and `q` (searches the text columns), newest first, and answer `{ "items": [...], "total": 57, "ready": true }`.

### GET /api/admin/summary?days=14
```json
{ "ready": true,
  "today": { "orders": 2, "revenue": 23724.2, "quotes": 14, "abandoned": 1 },
  "funnel": { "quoted": 120, "uploaded": 40, "checkout": 18, "ordered": 9, "paid": 7 },
  "series": [{ "date": "2026-11-15", "orders": 2, "revenue": 23724.2, "quotes": 14 }],
  "attention": [{ "kind": "review" | "paid" | "abandoned" | "manual", "label": "Orders whose file needs a check", "count": 2, "to": "/admin/orders?status=review" }] }
```
Days are India time. Revenue counts paid orders. Funnel covers sessions and orders created in the window.

### GET /api/admin/orders?status=&q=&page=&size=
`status` is a payment status (`pending|paid|failed|refunded|cancelled`), a stage (`new|file_review|in_production|quality_check|shipped|delivered|cancelled`) or `review` (needs review). Items:
`{ id, createdAt, wooOrderId, paymentStatus, stage, needsReview, firstName, lastName, company, email, city, quantity, total }`

### GET /api/admin/orders/{id}
```json
{ "id", "createdAt", "updatedAt", "wooOrderId", "wooStatus", "paymentStatus", "stage", "needsReview",
  "reviewReasons": ["..."], "customerNote", "adminNote", "paymentUrl", "sessionId", "specs": {}, "summary": {},
  "customer": { "firstName", "lastName", "email", "phone", "company", "gstin", "address1", "address2", "city", "state", "postcode" },
  "money": { "quantity", "pricePerBoard", "engFee", "subtotal", "gst", "total" },
  "margin": { "costPerBoard", "perBoard", "total", "marginPct" } | null,
  "file": { "id", "filename", "sizeBytes", "widthMm", "heightMm", "copperLayers", "minDrillMm", "parseOk", "warnings", "createdAt" } | null,
  "timeline": [{ "id", "createdAt", "adminId", "adminName", "action", "targetType", "targetId", "detail" }] }
```
Timeline actions: `order_created`, `order_stage` `{from,to}`, `order_note` `{note}`, `woo_webhook` and `woo_sync` `{from,to,wooStatus}`.

### PATCH /api/admin/orders/{id}
`{ "stage"?, "adminNote"? }` -> order detail.

### POST /api/admin/orders/{id}/sync
Fetches the order from WooCommerce and applies the status map -> order detail.

### GET /api/admin/sessions?view=abandoned|manual|browsing&q=&page=&size=
`abandoned`: stage `checkout_started`, no order, quiet for 10 minutes. `manual`: stage `manual_requested`. `browsing`: `quoted` or `file_uploaded`. Items are session rows:
`{ id, createdAt, updatedAt, stage, boardW, boardL, quantity, layers, orderType, pricePerBoard, total, specs, firstName, lastName, email, phone, company, note, uploadId, orderId, quoteCount, handled, adminNote }`

### PATCH /api/admin/sessions/{id}
`{ "handled"?, "adminNote"? }` -> the session row.

### GET /api/admin/customers?q=&page=&size=
Items `{ email, firstName, lastName, phone, company, orderCount, paidTotal, firstOrderAt, lastOrderAt }`, most recent buyer first.

### GET /api/admin/files?q=&page=&size=
Items are upload rows `{ id, createdAt, sessionId, orderId, filename, sizeBytes, storagePath, widthMm, heightMm, copperLayers, minDrillMm, parseOk, warnings }`.

### GET /api/admin/files/{id}/link
`{ "url": "signed link valid 5 minutes" }`. Logged as `file_link`.

## Admin: pricing (manager and up)

### GET /api/admin/pricing
`{ "config": PricingConfig, "updatedAt": "..." | null, "ready": true }` (`ready: false` means built in defaults are served).

### PUT /api/admin/pricing
`{ "config": PricingConfig, "note"?: "" }` -> same shape as GET. 422 `{ "detail": [{ "where", "msg" }] }` when invalid; 503 "Run supabase/migrations/002_pricing_v2.sql in the Supabase SQL editor" when tables are missing.

### GET /api/admin/pricing/defaults
`{ "config": PricingConfig }`

### GET /api/admin/pricing/versions
`{ "items": [{ "id", "createdAt", "adminName", "note" }] }`

### POST /api/admin/pricing/versions/{id}/restore
Same shape as GET /pricing.

### POST /api/admin/pricing/check
`{ "config" }` -> `{ "ok": true, "errors": [{ "where", "msg" }] }`

### POST /api/admin/quote
`{ ...QuoteRequest, "config"?: PricingConfig }` prices with the draft when given. Response: public quote plus `costPerBoard`, `profit { perBoard, total, marginPct }`, `lines [{ key, label, section, value, adjustments [{ category, option, op, value, delta }] }]`.

PricingConfig shape: see docs/v2-spec.md "Config shape".

## Admin: team and system

### GET /api/admin/users (owner)
`{ "users": [{ "id", "name", "phone", "email", "note", "status": "pending" | "approved", "role": "owner" | "manager" | "staff", "createdAt", "lastSignInAt", "isYou" }] }`, pending first.

### POST /api/admin/users/{id}/approve (owner)
`{ "role" }` (optional, default `staff`) -> one user. 404 when missing.

### PATCH /api/admin/users/{id} (owner)
`{ "role" }` -> one user. 409 `"The last owner cannot be removed or demoted"`. 503 before `003_records.sql`.

### DELETE /api/admin/users/{id} (owner, 204)
403 `"You cannot remove yourself"`, 409 for the last owner.

### GET /api/admin/activity?page=&size= (manager and up)
List of activity rows (see timeline). Actions also include `team_approve`, `team_role`, `team_remove`, `session_handled`, `session_reopened`, `session_note`, `file_link`, and the pricing save rows.

### GET /api/admin/store (any admin)
`{ "wooEnabled", "storeUrl", "webhookReady", "lastWebhookAt", "pricingReady", "recordsReady" }`

## Supabase

Run in the SQL editor, in order, each safe to re-run: `supabase/schema.sql` (first setup), `supabase/migrations/001_engine_params.sql`, `002_pricing_v2.sql`, `003_records.sql`. Every table has RLS on with no policies (server key only). Gerber zips live in the private bucket `GERBER_BUCKET` at `uploads/{uploadId}.zip`.

Records tables (`003_records.sql`): `quote_sessions`, `uploads`, `orders`, `activity_log`, view `customers`, and `admin_users.role`.
