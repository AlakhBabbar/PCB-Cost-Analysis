import re
from dataclasses import dataclass, field

from backend.models.pricing import Category, Option, PricingConfig, QuoteRequest
from backend.services.pricing.expr import ExprError, evaluate, parse
from backend.services.pricing.spans import NUMERIC, find, number, offered

INPUTS = ("width", "length", "qty", "layers", "makes_board", "assembles", "ladder_markup_pct", "option_fees")
NUM = re.compile(r"^\s*(-?\d+(?:\.\d+)?)")


def lead_number(text: str) -> float:
    m = NUM.match(text)
    return float(m.group(1)) if m else 0.0


@dataclass
class Run:
    values: dict
    chosen: dict[str, list[Option]]
    adjustments: dict[str, list[dict]] = field(default_factory=dict)
    manual: str | None = None


def choose(req: QuoteRequest, cfg: PricingConfig) -> dict[str, list[Option]]:
    chosen = {}
    for c in cfg.categories:
        live = {o.name: o for o in c.options if o.enabled}
        if c.multi:
            wanted = {k for k, on in getattr(req, c.key, {}).items() if on}
            if bad := sorted(wanted - set(live)):
                raise ValueError(f"{c.label}: {', '.join(bad)} is not available")
            chosen[c.key] = [o for o in c.options if o.name in wanted]
        elif c.kind == "number":
            value, on = getattr(req, c.key), list(live.values())
            hit = find(on, n) if (n := number(value)) is not None else None
            if not hit:
                raise ValueError(f"{c.label}: {value} is not something we make. We make {offered(on)}.")
            chosen[c.key] = [hit]
        else:
            value = getattr(req, c.key)
            if value not in live:
                raise ValueError(f"{c.label}: '{value}' is not a valid option")
            chosen[c.key] = [live[value]]
    return chosen


def adjust(value: float, c: Category, picks: list[Option], log: list[dict]) -> float:
    for o in picks:
        before = value
        value = value * o.value if o.op == "x" else value * (1 + o.value / 100) if o.op == "pct" else value + o.value
        log.append({"category": c.key, "option": o.name, "op": o.op, "value": o.value, "delta": value - before})
    return value


def inputs(req: QuoteRequest, cfg: PricingConfig, chosen: dict) -> dict:
    ot = next((t for t in cfg.orderTypes if t.name == req.orderType and t.enabled), None)
    if not ot:
        raise ValueError(f"Order type: '{req.orderType}' is not a valid option")
    tier = next((t.markupPct for t in sorted(cfg.markupTiers, key=lambda t: t.maxQty) if req.quantity <= t.maxQty), None)
    settings = {s.key: s.value for s in cfg.settings}
    return {
        **settings,
        "width": req.boardW, "length": req.boardL, "qty": req.quantity, "layers": lead_number(req.layers),
        "makes_board": int(ot.makesBoard), "assembles": int(ot.assembles),
        "ladder_markup_pct": tier if tier is not None else settings.get("markup_above_ladder_pct", 0),
        "option_fees": sum(o.orderFee for picks in chosen.values() for o in picks),
    }


def run(req: QuoteRequest, cfg: PricingConfig, rules: bool = True) -> Run:
    chosen = choose(req, cfg)
    env = inputs(req, cfg, chosen)
    picked = lambda cat, opt: any(o.name == opt for o in chosen.get(cat, []))
    typed = {k: number(getattr(req, k)) or 0.0 for k in NUMERIC}  # what the buyer asked for, not the range it fell in
    num = lambda cat: typed[cat] if cat in typed else lead_number(chosen[cat][0].name) if chosen.get(cat) else 0.0
    out = Run(values={}, chosen=chosen)
    for f in cfg.formulas:
        try:
            value = evaluate(parse(f.expr), env, picked, num)
        except ExprError as exc:
            raise ExprError(f'Formula "{f.label}": {exc}') from None
        log = []
        for c in cfg.categories:
            if c.target == f.key:
                value = adjust(value, c, chosen[c.key], log)
        env[f.key] = out.values[f.key] = value
        out.adjustments[f.key] = log
    if rules:
        out.manual = check_rules(cfg, env, picked, num)
    return out


def check_rules(cfg: PricingConfig, env: dict, picked, num) -> str | None:
    manual = None
    for r in cfg.rules:
        if not r.enabled:
            continue
        try:
            hit = evaluate(parse(r.when), env, picked, num)
        except ExprError as exc:
            raise ExprError(f'Rule "{r.message}": {exc}') from None
        if hit and r.action == "block":
            raise ValueError(r.message)
        if hit and not manual:
            manual = r.message
    return manual
