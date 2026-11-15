# v2 build spec

Single source of truth for the v2 revamp. Every agent reads this first. Where this file and older docs disagree, this file wins.

## Hard rules
- No git commits, no git add, no stash, no push. Not even locally. Write files only. Read-only git is fine.
- Never write a person's name, email or GitHub handle into any file.
- No em dashes anywhere (code, comments, UI strings). No emoji in UI, use lucide icons.
- No large comments or docstrings. One short line when a line would surprise.
- Modular: backend `core/ routers/ services/ models/ utils/`, frontend `features/ components/ api/ lib/`. Short files. Reuse shared helpers, no copy paste.
- Ponytail: the smallest thing that fully works. Stdlib and what is installed first. No speculative abstractions.
- Stay inside the files your brief gives you. If you need a change elsewhere, say so in your hand-back instead of editing.
- Secrets live in `backend/.env` and `frontend/.env`. Never print them.

## What the client wants
1. WooCommerce keeps doing checkout and payment. This app becomes the main place to see orders.
2. Total control over the pricing formulas: every number, every option, the operator each option uses, and the formulas themselves.
3. The admin is a factory owner, not a developer. Nothing is removed, but everything is filed by job and named in plain words. Advanced things (formulas) sit behind one clearly marked page.
4. Competitor and comparative pricing is removed entirely.
5. Minimal UI, real motion, vector art.

## Pricing engine v2

### Config shape (API JSON, camelCase)
```
PricingConfig {
  settings:   [{ key, label, page, section, unit, kind: "number"|"switch", value, min, max, help }]
  categories: [{ key, label, target, multi, help,
                 options: [{ name, label, op: "x"|"pct"|"add", value, orderFee, note, enabled }] }]
  orderTypes: [{ name, makesBoard, assembles, enabled }]
  markupTiers:[{ maxQty, markupPct }]
  formulas:   [{ key, label, section, expr, help, locked }]
  rules:      [{ id, message, when, action: "block"|"manual", enabled }]
}
```
- `settings` are the named numbers. `kind: "switch"` stores 0 or 1. `page` is one of `limits | price | factory`.
- `categories` are the buyer's choices. The 13 category keys are fixed because they are the request fields: `layers, thickness, copper, material, finish, traceSpace, ipcStd, minHole, maskColor, silkscreen, testing, specials, express`. Options inside are fully editable. `specials` has `multi: true`.
- Operator fields: each option has `op` and `value`. `x` multiplies, `pct` adds a percent, `add` adds rupees per board. `orderFee` is a one time rupee fee per order. `note` is buyer facing text (used for delivery time on `express`).
- `target` is the key of the formula line the category adjusts. After that line is computed the engine applies the chosen option of every category that targets it, in category order, and the adjusted number replaces the line value.
- `formulas` are ordered lines. Each line may use inputs, settings, built ins and earlier lines only. `locked` lines cannot be deleted or renamed (the engine needs them) but their `expr` can be edited.

### Expression language
Parsed with Python `ast` in eval mode and walked with a whitelist. Nothing is ever passed to `eval`.
- Numbers, names, `+ - * /`, unary minus, parentheses, comparisons, `and or not`.
- Functions: `min max floor ceil round`, `if(cond, a, b)` (rewrite `if(` to an internal name before parsing), `picked("category", "option")` gives 1 or 0, `num("category")` gives the leading number of the chosen option name (`"3/3"` gives 3, `"1.6"` gives 1.6, no number gives 0).
- String literals are allowed only as arguments of `picked` and `num`.
- Booleans are 1 and 0. Divide by zero and unknown names raise a clear error naming the line.

### Inputs and built ins
`width, length` (mm), `qty`, `layers` (number), `makes_board`, `assembles` (1 or 0 from the order type), `ladder_markup_pct` (first tier with `qty <= maxQty`, else setting `markup_above_ladder_pct`), `option_fees` (sum of `orderFee` of chosen options).

### Required lines
`cost_per_board, price_per_board, engineering_fee, subtotal, gst, total`. Missing one makes the config invalid.

### Default settings
page `limits`, section "Size and quantity": `min_board_mm` 10, `max_board_mm` 500, `min_qty` 1, `max_auto_qty` 2000.

page `price`:
- "Markup": `use_markup_ladder` switch 0, `fixed_markup_pct` 15, `markup_above_ladder_pct` 30
- "Safety nets": `min_margin_pct` 10, `min_order_value` 1000
- "Fees": `bank_charges_pct` 0.5, `warranty_pct` 1, `base_engineering_fee` 1000, `extra_layer_fee` 500, `compliance_fee` 500
- "Tax": `gst_pct` 18

page `factory`:
- "Who makes the bare board": `inhouse` switch 0, `supplier_per_board` 42, `supplier_rate` 1200 (INR per m2), `supplier_order_fee` 1750
- "Panel": `panel_width` 250, `panel_length` 250, `routing_gap` 5, `edge_margin` 10, `yield_pct` 94
- "Materials": `laminate_rate` 1600, `process_rate` 900, `drill_wear` 3
- "Parts and consumables": `parts_per_board` 80, `parts_wastage_pct` 2, `parts_freight_pct` 3, `solder_paste` 8, `other_consumables` 12, `bare_consumables_share_pct` 40
- "Labour": `operators_per_shift` 1, `shifts` 1, `work_days` 26, `operator_salary` 18000, `qc_salary` 0, `supervisor_salary` 0, `benefits_pct` 18, `rework_pct` 5, `cam_hours` 2, `cam_hours_per_month` 160
- "Power": `load_kw` 15, `run_hours` 8, `utilisation_pct` 60, `power_tariff` 8.5, `lighting` 5000, `nitrogen` 2000, `water_effluent` 2000
- "Overheads": `rent` 15000, `admin_salaries` 10000, `marketing` 5000, `software` 3000, `maintenance` 3000, `insurance` 2000, `interest` 5000, `misc` 3000, `depreciation` 8000, `order_share_pct` 15, `outsourced_labour_share_pct` 60, `outsourced_power_share_pct` 50
- "Packaging": `esd_bag` 2.5, `carton` 1.5, `shipping_per_board` 5, `bare_packaging_share_pct` 50
- "Tooling": `tooling` 15000

Every setting gets a plain label, a unit (`INR`, `%`, `mm`, `pcs`, `hrs`, `kW`, `INR/m2`, `INR/month`, or empty), a one sentence help line with a small worked example, and sane `min`/`max` (percent 0 to 100 unless it is a markup, money 0 upward, nothing negative).

### Default categories (all target `board_cost` except `express`)
In this order:
- `layers` x: 1 0.7, 2 1, 4 1.8, 6 2.6, 8 3.4
- `thickness` x: 0.6 0.77, 0.8 0.82, 1.0 0.86, 1.2 0.91, 1.6 1, 2.0 1.14, 2.4 1.27, 3.2 1.45
- `copper` x: 0.5 0.95, 1 1, 1.5 1.15, 2 1.35, 3 1.7, 4 2.2
- `material` x: FR4 TG130 1, FR4 TG150 1.08, FR4 TG170 1.15, High-Freq 4, Aluminum 1.3
- `finish` pct: HASL 0, HASL-LF 8, ENIG-1 20, ENIG-2 28, ENIG-3 35, ImmTin 12, ImmSilver 15, OSP -5
- `traceSpace` x: 6/6 1, 5/5 1.1, 4/4 1.25, 3/3 1.5
- `ipcStd` x: IPC-2 1, IPC-3 1.15
- `minHole` add: 0.40 0, 0.30 3, 0.25 8, 0.20 15, 0.15 25
- `maskColor` add: Green 0, Blue 2, Red 2, Black 3, White 3, Yellow 2, Purple 5
- `silkscreen` add: White 0, Black 0, Yellow 0, None 0
- `testing` add: FlyingProbe 0, Fixture 8, None 0
- `specials` pct with orderFee, multi: impedance 12 / 1000 "Impedance control", blindVias 25 / 2000 "Blind / buried vias", goldFingers 10 / 500 "Gold fingers", halfHole 8 / 500 "Castellated holes", resinPlug 10 / 500 "Resin plugged vias", metalEdge 15 / 500 "Edge plating", halogenFree 8 / 500 "Halogen free"
- `express` targets `selling_price`, x: Standard 1 note "7-10 working days", Urgent 1.5 note "3-5 working days"

Option order in each list is the order shown to the buyer. The form default for a field is the first enabled option that leaves the price alone (x 1, or 0), which `GET /api/pricing/options` returns under `defaults`. Order types: Bare PCB (makesBoard 1, assembles 0), PCBA (1, 1), Assembly Only (0, 1).

Markup ladder: 5 100, 10 90, 20 80, 50 72, 100 65, 300 58, 500 50, 1000 42, 2000 35.

### Default formulas
```
section panel
boards_per_row    = max(floor((panel_width - 2*edge_margin + routing_gap) / (width + routing_gap)), 0)
boards_per_col    = max(floor((panel_length - 2*edge_margin + routing_gap) / (length + routing_gap)), 0)
boards_per_panel  = boards_per_row * boards_per_col
board_area        = width * length / 1000000
material_area     = if(boards_per_panel > 0, panel_width * panel_length / 1000000 / boards_per_panel, board_area)
section board
inhouse_board     = material_area * (laminate_rate + process_rate) + drill_wear
supplier_board    = supplier_per_board + board_area * supplier_rate + supplier_order_fee / qty
board_cost        = makes_board * if(inhouse, inhouse_board, supplier_board)
section assembly
parts_cost        = assembles * parts_per_board * (1 + parts_wastage_pct/100) * (1 + parts_freight_pct/100)
we_do_work        = max(inhouse, assembles)
consumables       = we_do_work * (solder_paste + other_consumables) * if(assembles, 1, bare_consumables_share_pct/100)
section running
yield_rate        = if(we_do_work, min(max(yield_pct, 1), 100) / 100, 1)
boards_made       = qty / yield_rate
labour_month      = (operators_per_shift * shifts * operator_salary + (qc_salary + supervisor_salary) * shifts) * (1 + benefits_pct/100)
power_month       = load_kw * work_days * shifts * run_hours * utilisation_pct/100 * power_tariff + lighting + nitrogen + water_effluent
overheads_month   = rent + admin_salaries + marketing + software + maintenance + insurance + interest + misc + depreciation
labour            = we_do_work * labour_month * order_share_pct/100 / boards_made * (1 + rework_pct/100) * if(inhouse, 1, outsourced_labour_share_pct/100)
power             = we_do_work * power_month * order_share_pct/100 / boards_made * if(inhouse, 1, outsourced_power_share_pct/100)
overheads         = we_do_work * overheads_month * order_share_pct/100 / boards_made
packaging         = if(assembles, esd_bag + carton + shipping_per_board, (esd_bag + inhouse * shipping_per_board) * bare_packaging_share_pct/100)
section cost
unit_cost         = (board_cost + parts_cost + consumables + labour + power + overheads + packaging) / yield_rate
one_time_cost     = inhouse * (tooling + cam_hours * supervisor_salary / cam_hours_per_month) + compliance_fee
cost_per_board    = unit_cost + one_time_cost / qty                       (locked)
section price
markup_pct        = if(use_markup_ladder, ladder_markup_pct, fixed_markup_pct)
selling_price     = cost_per_board * (1 + markup_pct/100)
bank_and_warranty = selling_price * (bank_charges_pct + warranty_pct) / 100
engineering_fee   = we_do_work * (base_engineering_fee + extra_layer_fee * max(layers/2 - 1, 0)) + option_fees   (locked)
margin_floor      = cost_per_board / (1 - min_margin_pct/100)
price_per_board   = max(selling_price + bank_and_warranty, margin_floor, (min_order_value - engineering_fee) / qty)   (locked)
subtotal          = price_per_board * qty + engineering_fee              (locked)
gst               = subtotal * gst_pct / 100                             (locked)
total             = subtotal + gst                                       (locked)
```
Each line gets a plain label ("Boards per panel", "Cost per board", "Price per board") and a one line help.

### Default rules (checked after all lines)
- `width < min_board_mm or length < min_board_mm` block "This board is smaller than we can make."
- `max(width, length) > max_board_mm` manual "This board is larger than we price online."
- `inhouse and boards_per_panel < 1` manual "This board does not fit our panel."
- `qty < min_qty` block "Quantity is below our minimum."
- `qty > max_auto_qty` manual "Large orders get a custom price."
- `picked("specials", "blindVias") and layers < 4` block "Blind or buried vias need 4 or more layers."
- `picked("material", "Aluminum") and layers > 2` block "Aluminium boards are 1 or 2 layers."
- `picked("specials", "impedance") and layers < 4` block "Impedance control needs 4 or more layers."
- `picked("material", "High-Freq")` manual "High frequency boards are quoted by our team."
- `layers >= 6 and num("thickness") < 0.8` block "6 layers need a 0.8 mm or thicker board."
- `layers >= 8 and num("thickness") < 1.0` block "8 layers need a 1.0 mm or thicker board."
- `num("copper") >= 3 and layers > 2` block "3 oz and 4 oz copper are for 1 and 2 layer boards."
- `num("traceSpace") < 4 and layers < 4` block "3/3 mil traces need 4 or more layers."
- `num("copper") >= 3 and num("traceSpace") < 5` block "Heavy copper cannot be combined with fine traces."
- `num("minHole") > 0 and num("thickness") / num("minHole") > 10` block "That hole is too small for this board thickness."
- `assembles` manual "Assembly orders are priced after we review your parts list." (enabled false)

`block` returns 422 with the message. `manual` returns a normal response with `manual: true` and the message, and no price.

### Engine results
Internal full result (admin): everything in the public result plus `costPerBoard`, `profit {perBoard, total, marginPct}`, `lines: [{key, label, section, value, adjustments: [{category, option, op, value, delta}]}]`.

Public result: `pricePerBoard, quantity, engFee, subtotal, gstPct, gst, total, delivery, summary, manual, manualReason`. No panel data, no cost, no lines. `summary` now also carries Order type, Material and Silkscreen so the factory sees every choice.

Python surface other modules rely on (keep these names):
- `backend.services.pricing.quote.calculate_quote(req: QuoteRequest, cfg: PricingConfig) -> AdminQuoteResponse` raising `ValueError` on block
- `backend.services.pricing.quote.public_quote(full) -> QuoteResponse`
- `backend.services.pricing.store.get_config() -> PricingConfig`, `load_config()`, `save_config(cfg, admin, note)`, module attribute `_cache`
- `backend.models.pricing.QuoteRequest` keeps its current fields

### Validation on save
Reject with 422 and a list of `{where, msg}` in plain words when: an expression does not parse, a name is unknown or used before it is defined, a required line is missing, a category target is not a line, keys are duplicated, a setting is outside its min/max, a markup ladder quantity repeats, or any of three built in sample boards (small 2 layer, 4 layer mid, PCBA) fails to price to a finite number above zero.

### Storage (Supabase, relational)
New tables only, old tables are left alone: `price_settings, price_categories, price_options, price_order_types, price_markup_tiers, price_formulas, price_rules, price_versions`. One Postgres function `save_pricing(cfg jsonb, admin_id text, admin_name text, note text)` replaces everything in one transaction and adds a row to `price_versions` (snapshot jsonb, who, when, note). The API calls it through PostgREST rpc. If the tables are missing the engine serves the built in defaults (so quoting works before setup) and admin save answers 503 with "Run supabase/migrations/002_pricing_v2.sql in the Supabase SQL editor". The tables start empty; on its first run the API fills them with the defaults above and, where an old `pricing_rates` row maps to a new setting, copies the admin's current value across.

## Records, orders and safety

### Tables (migration `003_records.sql`)
- `quote_sessions`: `id uuid pk` (made in the browser), `created_at, updated_at`, `stage` (`quoted | file_uploaded | checkout_started | manual_requested | ordered`), `board_w, board_l, quantity, layers, order_type, price_per_board, total` (latest quote), `specs jsonb`, contact columns `first_name, last_name, email, phone, company`, `note`, `upload_id`, `order_id`, `quote_count int`, `handled bool default false`, `admin_note`.
- `uploads`: `id uuid pk, created_at, session_id, order_id, filename, size_bytes, storage_path, width_mm, height_mm, copper_layers, min_drill_mm, parse_ok bool, warnings jsonb`.
- `orders`: `id uuid pk, created_at, updated_at, session_id, upload_id, woo_order_id int unique, woo_status, payment_status` (`pending | paid | failed | refunded | cancelled`), `stage` (`new | file_review | in_production | quality_check | shipped | delivered | cancelled`), `needs_review bool, review_reasons jsonb`, customer columns `first_name, last_name, email, phone, company, gstin, address1, address2, city, state, postcode`, `customer_note, admin_note`, `specs jsonb, summary jsonb, quantity, price_per_board, eng_fee, subtotal, gst, total, cost_per_board, payment_url`.
- `activity_log`: `id bigserial pk, created_at, admin_id, admin_name, action, target_type, target_id, detail jsonb`. Order timelines are the rows with `target_type = 'order'`. Webhook and system events use a null admin.
- view `customers`: orders grouped by lower(email) with name, phone, company, order count, paid total, first and last order time.
- `admin_users` gains `role text not null default 'manager'` (`owner | manager | staff`); the earliest approved admin becomes `owner`.
All tables get row level security enabled with no policies (server key only), like the existing ones.

### Roles
`staff`: sales pages. `manager`: sales and pricing. `owner`: everything including team. Only an owner changes roles, approves or removes people. The last owner cannot be removed or demoted. `backend/core/auth.py` already exposes `require_admin`, `require_manager`, `require_owner`; a missing `role` column counts as owner so login keeps working before the migration runs.

### Public flow
- Browser makes a session id (uuid, kept in localStorage) and sends it as header `X-Session-Id` on quote, parse, checkout and order calls.
- `POST /api/quote`: prices, then in a background task upserts the session (stage `quoted`, never lowering a later stage).
- `POST /api/gerber/parse`: inspects the zip before opening (max 500 entries, max 250 MB unpacked, no absolute or parent paths), parses, stores the zip once in the private bucket at `uploads/{uploadId}.zip`, inserts `uploads`, links the session. Response is the current parse result plus `uploadId` and `ok` (false when `errors` is not empty or there are no dimensions). An unusable file cannot be ordered.
- `POST /api/checkout` JSON `{ kind: "checkout" | "manual", contact: {firstName?, lastName?, email?, phone?, company?}, note?, quote? }`: saves contact on the session and sets the stage. Called when the buyer has typed a valid email or phone, and when they send a manual quote request. Answers 204.
- `POST /api/order` JSON `{ uploadId, quote, customer }`: validates, prices on the server, compares the typed specs with the stored parse (size within 2 mm, copper layers, smallest hole) and sets `needs_review` with plain reasons instead of rejecting, creates the WooCommerce order with every choice visible in the line item, inserts `orders`, marks the session `ordered`, answers `{ orderId, paymentUrl }`. A `manual` quote cannot be ordered. `customer` adds optional `company` and `gstin` (15 character GSTIN pattern).
- `POST /api/woo/webhook`: verifies the `X-WC-Webhook-Signature` header (base64 HMAC SHA256 of the raw body with `WC_WEBHOOK_SECRET`), maps the WooCommerce status to `payment_status`, updates the order, writes a timeline row.
- If the records tables are missing, quoting and ordering still work; record writes are logged and skipped.
- The WooCommerce order note no longer carries a 5 year link. It says the file is in the admin panel. Admin file links are signed for 5 minutes.

### Limits
Small in memory limiter per client IP (dependency in `backend/core/ratelimit.py`): quote 120 per minute, parse 10 per minute, checkout 30 per minute, order 5 per minute, sign in 10 per minute, sign up 5 per hour. Answers 429 "Too many requests. Please wait a minute."

### Admin API (all under `/api/admin`, JSON camelCase)
Sales (staff and up):
- `GET /summary?days=14` gives `{ ready, today: {orders, revenue, quotes, abandoned}, funnel: {quoted, uploaded, checkout, ordered, paid}, series: [{date, orders, revenue, quotes}], attention: [{kind, label, count, to}] }`
- `GET /orders?status=&q=&page=&size=` gives `{ items, total }`; `GET /orders/{id}` detail with customer, summary, money, margin, file, timeline; `PATCH /orders/{id}` `{stage?, adminNote?}`; `POST /orders/{id}/sync` pulls status from WooCommerce
- `GET /sessions?view=abandoned|manual|browsing&q=&page=` gives `{ items, total }` (abandoned means `checkout_started`, no order, quiet for 10 minutes); `PATCH /sessions/{id}` `{handled?, adminNote?}`
- `GET /customers?q=&page=`
- `GET /files?q=&page=`; `GET /files/{id}/link` gives `{ url }`
Pricing (manager and up):
- `GET /pricing` gives `{ config, updatedAt, ready }`; `PUT /pricing` `{ config, note? }`; `GET /pricing/defaults`
- `GET /pricing/versions`; `POST /pricing/versions/{id}/restore`
- `POST /pricing/check` `{ config }` gives `{ ok, errors }`
- `POST /quote` `{ ...QuoteRequest, config? }` prices with the draft config when given, so a change can be tried before saving
Team and system (owner unless noted):
- `GET /users`, `POST /users/{id}/approve` `{ role }`, `PATCH /users/{id}` `{ role }`, `DELETE /users/{id}`
- `GET /activity?page=` (manager and up)
- `GET /store` (any admin) gives `{ wooEnabled, storeUrl, webhookReady, lastWebhookAt, pricingReady, recordsReady }`
- `/api/auth/me` and sign in also return `role`

## Admin panel

### Menu
```
Home
SALES     Orders · Abandoned checkouts · Quote requests · Customers · Files
PRICING   Buyer options · Price rules · Factory costs · Formulas · Price tester
SETTINGS  Team · Activity · Store
```
Phone: bottom bar Home, Orders, Pricing, More (More opens a sheet with the rest). Menu items a role cannot use are hidden.

Routes under `/admin`: `` (home), `orders`, `orders/:id`, `abandoned`, `requests`, `customers`, `files`, `pricing/options`, `pricing/rules`, `pricing/costs`, `pricing/formulas`, `pricing/tester`, `team`, `activity`, `store`, plus `login`, `signup`, `pending`.

### Pages in one line each
- Home: today's orders, money, quotes and abandoned checkouts; a 14 day chart; the funnel as vector art; a short "needs you" list.
- Orders: searchable list with payment and stage badges; detail page with board specs, customer, money and margin, file preview and download, timeline, stage control.
- Abandoned checkouts: who left, their board, quoted price, contact, mark as handled.
- Quote requests: manual quote requests from boards the engine would not price.
- Customers: repeat buyers and what they spent.
- Files: every uploaded Gerber with preview and download.
- Buyer options: one card per category. Each option row has name, operator, amount, one time fee, on/off. Size and quantity limits. Build rules in plain sentences.
- Price rules: markup (fixed or ladder), safety nets, fees, tax.
- Factory costs: who makes the board, panel, materials, parts, labour, power, overheads, packaging, tooling.
- Formulas: the price drawn as a pipeline (vector art) from board cost to total. Each line opens to show and edit its formula with clickable chips for settings and earlier lines, live check, and a worked example with real numbers. Marked Advanced.
- Price tester: price any board with the saved or the unsaved numbers, see every line and the margin.
- Every pricing page shares one draft, one save bar, "Try it" (opens the tester with the draft), history with restore.

### Look
Shopify admin is the reference for structure (read from Mobbin screenshots), kept light.
- Canvas `#f4f4f3`, cards white with 12px radius, hairline border `#e6e6e3` and at most `0 1px 0 rgba(0,0,0,.05)`. No heavy shadows.
- Text `#1f1f1f`, secondary `#666`. Inter. Body 13 to 14px on desktop, 15 to 16px on phones. Page title 20px semibold, card title 14px semibold.
- One dark primary button per page header (`#1f1f1f`, white text). Everything else is a white bordered secondary button. Buttons and inputs 8px radius, 32 to 36px tall.
- Colour is for status only: pill badges about 20px tall with a leading dot. Paid and done green, waiting amber, attention red, neutral grey. One quiet accent (PCB green `#0c6b4f`) for links, the active menu item mark and illustration highlights.
- Desktop: 240px sidebar with small grey group labels, active item on a white pill, top bar white with page search where useful. Lists run full width, detail and settings pages are capped near 1000px in two columns (2/3 main, 1/3 side cards).
- Tables: one white card, toolbar inside it (view tabs and search left, filters right), rows about 40px, money right aligned, relative dates. A row opens a full page, never a side panel.
- Phone: tables become two line rows (bold id left, amount right, grey meta line, badges), hairline dividers, sticky date group headers. Floating pill bottom bar.
- Settings: cards with a title and one grey line, inputs with the label above, unit inside the input, help below in 12px grey. The save bar shows only when something changed. Success is a dark toast at the bottom centre, never an alert.
- Empty states: one sentence about what will show here, why it matters, one button, and a 120 to 160px monoline SVG (boards, Gerber layers, drills) in grey with the accent.
- Vector art is hand written inline SVG components that use `currentColor` and the accent. No image files, no icon fonts beyond lucide.

### Motion (from the Blend web app, framer-motion with LazyMotion and `m`)
- Springs: step and panel `{stiffness: 420, damping: 38}`, sheet and dialog `{420, 32}`, list rows `{520, 40}`, tab ink `layoutId` `{500, 38}`, pop `{700, 22}`.
- House ease `[0.2, 0.8, 0.2, 1]`; CSS curve `cubic-bezier(0.32, 0.72, 0, 1)`.
- Dialog and sheet: scrim fades, panel from `y 24, scale 0.96`, exit `y 12, scale 0.98`. Phone sheets rise from the bottom in 320 ms.
- Lists: `opacity 0, y 10`, delay `min(i, 8) * 0.04`. Page change: `y 6` in, `y -4` out, 0.16 s.
- Press: `scale(0.97)` 120 ms. Numbers count up over 520 ms with ease out cubic. Success check draws its path in 0.42 s. Errors shake (380 ms).
- Skeleton sheen 1.4 s. Wrap trees in `MotionConfig reducedMotion="user"` and switch CSS animation off under `prefers-reduced-motion`.
