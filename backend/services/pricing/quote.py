from backend.models.pricing import AdminQuoteResponse, PricingConfig, QuoteRequest, QuoteResponse
from backend.services.pricing.engine import run
from backend.services.pricing.spans import NUMERIC, number

SUMMARY = [("layers", "Layers", ""), ("thickness", "Thickness", " mm"), ("copper", "Copper", " oz"),
           ("material", "Material", ""), ("finish", "Surface finish", ""), ("traceSpace", "Trace/space", " mil"),
           ("minHole", "Min hole", " mm"), ("maskColor", "Solder mask", ""), ("silkscreen", "Silkscreen", ""),
           ("ipcStd", "IPC class", ""), ("testing", "Testing", ""), ("express", "Production", ""),
           ("specials", "Special reqs", "")]


def _summary(req: QuoteRequest, chosen: dict, delivery: str) -> dict[str, str]:
    out = {"Order type": req.orderType, "Board": f"{req.boardW:g} x {req.boardL:g} mm"}
    for key, title, unit in SUMMARY:
        picks = chosen.get(key, [])
        text = f"{number(getattr(req, key)):g}" if key in NUMERIC and picks else ", ".join(o.label or o.name for o in picks)
        out[title] = text + unit if text else "None"
    out["Delivery"] = delivery
    return out


def calculate_quote(req: QuoteRequest, cfg: PricingConfig) -> AdminQuoteResponse:
    r = run(req, cfg)
    v = r.values
    labels = {f.key: f for f in cfg.formulas}
    lines = [{"key": k, "label": labels[k].label, "section": labels[k].section, "value": round(x, 4),
              "adjustments": [{**a, "delta": round(a["delta"], 4)} for a in r.adjustments[k]]} for k, x in v.items()]
    gst_pct = next((s.value for s in cfg.settings if s.key == "gst_pct"), 0)
    express = r.chosen.get("express", [])
    delivery = express[0].note if express else ""
    base = {"quantity": req.quantity, "gstPct": gst_pct, "delivery": delivery,
            "summary": _summary(req, r.chosen, delivery), "lines": lines}
    if r.manual:
        zero = dict.fromkeys(("pricePerBoard", "engFee", "subtotal", "gst", "total", "costPerBoard"), 0)
        return AdminQuoteResponse(**base, **zero, profit={"perBoard": 0, "total": 0, "marginPct": 0},
                                  manual=True, manualReason=r.manual)
    price, cost, sub = v["price_per_board"], v["cost_per_board"], v["subtotal"]
    profit = sub - cost * req.quantity
    return AdminQuoteResponse(
        **base,
        pricePerBoard=round(price, 2), engFee=round(v["engineering_fee"], 2), subtotal=round(sub, 2),
        gst=round(v["gst"], 2), total=round(v["total"], 2), costPerBoard=round(cost, 2),
        profit={"perBoard": round(price - cost, 2), "total": round(profit, 2),
                "marginPct": round(profit / sub * 100, 1) if sub else 0},
    )


def public_quote(full: AdminQuoteResponse) -> QuoteResponse:
    return QuoteResponse.model_validate(full.model_dump())
