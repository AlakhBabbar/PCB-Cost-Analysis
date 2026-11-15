# Pricing model (v2)

All money is INR. The engine lives in `backend/services/pricing/`. The contract is the "Pricing engine v2" section of `docs/v2-spec.md`; this page says how the code follows it.

## Files
- `expr.py` safe formula language: `ast` parse in eval mode, whitelist walk, never `eval`. Max 600 characters, max depth 40. `if(` is rewritten to an internal `_if` and is lazy, so `if(x > 0, 1 / x, 0)` is safe.
- `default_settings.py`, `defaults.py` the built in config as data (`default_config()`, `default_data()`).
- `engine.py` runs one quote: checks the buyer's choices, builds the inputs, computes the lines in order, applies category adjustments, checks the rules.
- `quote.py` `calculate_quote(req, cfg)` (admin result) and `public_quote(full)` (buyer result). Rounding to 2 dp happens only here.
- `validate.py` `check(data) -> (cfg | None, [{where, msg}])` for save, check and draft quotes.
- `store.py` + `rows.py` Supabase load (60 s cache), save through `rpc/save_pricing`, versions.
- `options.py` enabled option names per request field, for the order form.

## How a quote is priced
1. Each category's chosen option must exist and be enabled, else `ValueError` ("Layers: '3' is not a valid option"). Specials set to true must exist and be enabled; specials set to false are ignored.
2. Inputs: `width, length, qty, layers` (leading number of the layer option), `makes_board, assembles` (order type), `ladder_markup_pct` (first tier with `qty <= maxQty`, else `markup_above_ladder_pct`), `option_fees` (sum of `orderFee` of chosen options), plus every setting by key.
3. Formula lines run top to bottom. After a line, every category whose `target` is that line applies its chosen option(s) in category order: `x` multiplies, `pct` adds a percent, `add` adds rupees. Each step is kept as an adjustment `{category, option, op, value, delta}`.
4. Rules run after all lines, in order. Any `block` raises `ValueError(message)` (422). Otherwise the first `manual` rule makes the result `manual: true` with `manualReason` and all money at 0.

Default lines are in `defaults.py`. One rename from the spec: the yield line is `yield_rate`, because `yield` is a Python keyword and cannot be a name in the formula language.

## Results
- Public: `pricePerBoard, quantity, engFee, subtotal, gstPct, gst, total, delivery, summary, manual, manualReason`.
- Admin adds `costPerBoard`, `profit {perBoard, total, marginPct}` (total is subtotal minus cost of all boards; margin is that over subtotal) and `lines [{key, label, section, value, adjustments}]`.
- `summary` keys: Order type, Board, Layers, Thickness, Copper, Material, Surface finish, Trace/space, Min hole, Solder mask, Silkscreen, IPC class, Testing, Production, Special reqs, Delivery. Option labels are used when set.

## Storage
Tables `price_settings, price_categories, price_options, price_order_types, price_markup_tiers, price_formulas, price_rules, price_versions`, created by `supabase/migrations/002_pricing_v2.sql`. The tables start empty; on its first run the API fills them with the defaults (`services/pricing/legacy.py`) and copies the old `pricing_rates` values (and `fab_source = inhouse`) where a key maps. Markup and competitor values are not copied.

When the tables are missing or unreachable the engine serves the last good config, or the built in defaults, and `ready` is false. Saving then answers 503 with the setup message.

## Reference
Defaults, 130 x 80 mm, 275 pcs, 2 layers, Bare PCB, 1.6 mm, 1 oz, FR4 TG130, HASL, Green, 6/6, 0.40, IPC-2, no test, Standard: cost 73.30, price 89.27 per board, subtotal 24550.56, total with GST 28969.66.
