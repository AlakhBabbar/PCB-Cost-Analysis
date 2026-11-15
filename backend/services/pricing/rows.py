from backend.models.pricing import PricingConfig

SORT = {"order": "sort_order"}
TABLES = {"price_settings": SORT, "price_categories": SORT, "price_options": {"order": "category,sort_order"},
          "price_order_types": SORT, "price_markup_tiers": {"order": "max_qty"}, "price_formulas": SORT, "price_rules": SORT}


def rows_to_config(rows: dict[str, list[dict]]) -> PricingConfig:
    opts = {}
    for o in rows["price_options"]:
        opts.setdefault(o["category"], []).append({
            "name": o["name"], "label": o["label"], "op": o["op"], "value": o["value"],
            "orderFee": o["order_fee"], "note": o["note"], "enabled": o["enabled"]})
    return PricingConfig.model_validate({
        "settings": [{k: s[k] for k in ("key", "label", "page", "section", "unit", "kind", "value", "min", "max", "help")}
                     for s in rows["price_settings"]],
        "categories": [{"key": c["key"], "label": c["label"], "target": c["target"], "multi": c["multi"], "help": c["help"],
                        "options": opts.get(c["key"], [])} for c in rows["price_categories"]],
        "orderTypes": [{"name": t["name"], "makesBoard": t["makes_board"], "assembles": t["assembles"], "enabled": t["enabled"]}
                       for t in rows["price_order_types"]],
        "markupTiers": [{"maxQty": t["max_qty"], "markupPct": t["markup_pct"]} for t in rows["price_markup_tiers"]],
        "formulas": [{k: f[k] for k in ("key", "label", "section", "expr", "help", "locked")} for f in rows["price_formulas"]],
        "rules": [{"id": r["id"], "message": r["message"], "when": r["expr"], "action": r["action"], "enabled": r["enabled"]}
                  for r in rows["price_rules"]],
    })
