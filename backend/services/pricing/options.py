from backend.models.pricing import PricingConfig


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
            out[c.key] = next((o.name for o in on if o.value == neutral[o.op] and not o.orderFee), on[0].name)
    return out


def option_labels(cfg: PricingConfig) -> dict[str, dict[str, str]]:
    return {c.key: {o.name: o.label for o in c.options if o.label} for c in cfg.categories if any(o.label for o in c.options)}


def form_options(cfg: PricingConfig) -> dict:
    return options_from_config(cfg) | {"defaults": default_options(cfg), "labels": option_labels(cfg)}
