from backend.models.pricing import PricingConfig
from backend.services.pricing.spans import span


def options_from_config(cfg: PricingConfig) -> dict[str, list[str]]:
    out = {"orderType": [t.name for t in cfg.orderTypes if t.enabled]}
    return out | {c.key: [o.name for o in c.options if o.enabled] for c in cfg.categories}


def default_options(cfg: PricingConfig) -> dict[str, str]:
    # form default per single choice field: the first option that leaves the price alone, else the first
    neutral = {"x": 1, "pct": 0, "add": 0}
    out = {"orderType": next((t.name for t in cfg.orderTypes if t.enabled), "")}
    for c in cfg.categories:
        on = [o for o in c.options if o.enabled]
        if on and not c.multi:
            pick = next((o for o in on if o.value == neutral[o.op] and not o.orderFee), on[0])
            s = span(pick.name) if c.kind == "number" else None
            out[c.key] = f"{s[1]:g}" if s and s[0] != s[1] else pick.name
    return out


def number_fields(cfg: PricingConfig) -> dict[str, dict]:
    """Number categories for the form: unit, offered ranges, and whether the buyer types a value."""
    out = {}
    for c in cfg.categories:
        if c.kind == "number":
            spans = sorted(s for o in c.options if o.enabled and (s := span(o.name)))
            out[c.key] = {"unit": c.unit, "spans": spans, "typed": any(lo != hi for lo, hi in spans)}
    return out


def option_labels(cfg: PricingConfig) -> dict[str, dict[str, str]]:
    return {c.key: {o.name: o.label for o in c.options if o.label} for c in cfg.categories if any(o.label for o in c.options)}


def form_options(cfg: PricingConfig) -> dict:
    return options_from_config(cfg) | {"defaults": default_options(cfg), "labels": option_labels(cfg),
                                       "numbers": number_fields(cfg)}
