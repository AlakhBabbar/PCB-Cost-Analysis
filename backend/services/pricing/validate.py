import keyword
import math
from collections import Counter

from pydantic import ValidationError

from backend.models.pricing import PricingConfig, QuoteRequest
from backend.services.pricing.defaults import CATEGORY_KEYS, REQUIRED
from backend.services.pricing.engine import INPUTS, run
from backend.services.pricing.expr import FUNCS, ExprError, names, parse, string_calls
from backend.services.pricing.spans import find, problems, span

PAGE = {"limits": "Buyer options", "price": "Price rules", "factory": "Factory costs"}
FIELDS = {"settings": "Settings", "categories": "Buyer options", "orderTypes": "Order types", "markupTiers": "Quantity ladder",
          "formulas": "Formulas", "rules": "Build rules", "options": ""}
SAMPLES = [("Small 2 layer board", "2", 50, 40, 10, False), ("4 layer mid size board", "4", 120, 90, 250, False),
           ("Assembled board", "2", 80, 60, 100, True)]


def _err(where: str, msg: str) -> dict:
    return {"where": where, "msg": msg}


def _shape_errors(data: dict, exc: ValidationError) -> list[dict]:
    out = []
    for e in exc.errors():
        loc, node, parts = e["loc"], data, []
        for p in loc:
            node = node[p] if isinstance(node, (dict, list)) and (isinstance(p, int) or p in node) else None
            if isinstance(node, dict):
                parts.append(str(node.get("label") or node.get("name") or node.get("key") or node.get("message") or p))
            elif isinstance(p, str) and FIELDS.get(p, p):
                parts.append(FIELDS.get(p, p))
        out.append(_err(" > ".join(parts) or "Pricing", e["msg"].removeprefix("Value error, ")))
    return out


def check(data: dict) -> tuple[PricingConfig | None, list[dict]]:
    try:
        cfg = PricingConfig.model_validate(data)
    except ValidationError as exc:
        return None, _shape_errors(data, exc)
    errors = check_config(cfg)
    return (None if errors else cfg), errors


def _dupes(where: str, keys: list[str], what: str) -> list[dict]:
    return [_err(where, f'The {what} "{k}" is used more than once.') for k, n in Counter(keys).items() if n > 1]


def check_config(cfg: PricingConfig) -> list[dict]:
    errs = []
    errs += _dupes("Pricing", [s.key for s in cfg.settings] + [f.key for f in cfg.formulas] + list(INPUTS), "name")
    errs += _dupes("Buyer options", [c.key for c in cfg.categories], "category")
    errs += _dupes("Buyer options > Order types", [t.name for t in cfg.orderTypes], "order type")
    errs += _dupes("Buyer options > Build rules", [r.id for r in cfg.rules], "rule id")
    errs += [_err("Price rules > Quantity ladder", f"The quantity {q} appears more than once.")
             for q, n in Counter(t.maxQty for t in cfg.markupTiers).items() if n > 1]
    errs += _settings(cfg) + _categories(cfg)
    if not any(t.enabled for t in cfg.orderTypes):
        errs.append(_err("Buyer options > Order types", "Turn on at least one order type."))
    errs += _formulas(cfg)
    return errs or _samples(cfg)


def _settings(cfg: PricingConfig) -> list[dict]:
    errs = []
    for s in cfg.settings:
        where = f"{PAGE[s.page]} > {s.section} > {s.label}"
        if s.kind == "switch" and s.value not in (0, 1):
            errs.append(_err(where, "A switch must be on (1) or off (0)."))
        elif s.min is not None and s.value < s.min:
            errs.append(_err(where, f"{s.value:g} is below the lowest allowed value, {s.min:g}."))
        elif s.max is not None and s.value > s.max:
            errs.append(_err(where, f"{s.value:g} is above the highest allowed value, {s.max:g}."))
    return errs


def _categories(cfg: PricingConfig) -> list[dict]:
    errs = []
    keys = [c.key for c in cfg.categories]
    lines = {f.key for f in cfg.formulas}
    errs += [_err("Buyer options", f'The buyer option "{k}" is missing.') for k in CATEGORY_KEYS if k not in keys]
    errs += [_err("Buyer options", f'"{k}" is not a buyer option the order form knows.') for k in keys if k not in CATEGORY_KEYS]
    for c in cfg.categories:
        where = f"Buyer options > {c.label}"
        errs += _dupes(where, [o.name for o in c.options], "option")
        if c.kind == "number":
            errs += [_err(where, msg) for msg in problems(c.options)]
        if c.target not in lines:
            errs.append(_err(where, f'It changes the line "{c.target}", which is not a formula line.'))
        if c.multi != (c.key == "specials"):
            errs.append(_err(where, "Only special requirements can allow more than one pick."))
        if not c.multi and not any(o.enabled for o in c.options):
            errs.append(_err(where, "Turn on at least one option so the buyer can choose."))
    return errs


def _known_strings(cfg: PricingConfig, tree, where: str) -> list[dict]:
    cats = {c.key: {o.name for o in c.options} for c in cfg.categories}
    errs = []
    for fn, args in string_calls(tree):
        if args[0] not in cats:
            errs.append(_err(where, f'"{args[0]}" is not a buyer option.'))
        elif fn == "picked" and args[1] not in cats[args[0]]:
            errs.append(_err(where, f'"{args[1]}" is not an option of {args[0]}.'))
    return errs


def _formulas(cfg: PricingConfig) -> list[dict]:
    errs = []
    known = {s.key for s in cfg.settings} | set(INPUTS)
    keys = {f.key for f in cfg.formulas}
    for f in cfg.formulas:
        where = f"Formulas > {f.label or f.key}"
        if not f.key.isidentifier() or keyword.iskeyword(f.key) or f.key in FUNCS or f.key.startswith("_"):
            errs.append(_err(where, f'"{f.key}" cannot be used as a line name. Use letters, numbers and _ only.'))
        try:
            tree = parse(f.expr)
        except ExprError as exc:
            errs.append(_err(where, str(exc)))
        else:
            for n in sorted(names(tree) - known):
                why = "is defined further down" if n in keys else "is not a setting, input or line"
                errs.append(_err(where, f'"{n}" {why}.'))
            errs += _known_strings(cfg, tree, where)
        known.add(f.key)
    errs += [_err("Formulas", f'The line "{k}" is required and is missing.') for k in REQUIRED if k not in keys]
    for i, r in enumerate(cfg.rules, 1):
        where = f"Buyer options > Build rules > rule {i}"
        try:
            tree = parse(r.when)
        except ExprError as exc:
            errs.append(_err(where, str(exc)))
            continue
        errs += [_err(where, f'"{n}" is not a setting, input or line.') for n in sorted(names(tree) - known)]
        errs += _known_strings(cfg, tree, where)
    return errs


def _sample_value(c, want: str | None = None) -> str:
    """A value the category accepts: the wanted one when offered, else the first choice."""
    on = [o for o in c.options if o.enabled]
    if c.kind != "number":
        return want if any(o.name == want for o in on) else on[0].name
    if want and find(on, float(want)):
        return want
    first = min((s for o in on if (s := span(o.name))), default=(0, 0))
    return f"{first[0]:g}"


def _samples(cfg: PricingConfig) -> list[dict]:
    cats = [c for c in cfg.categories if not c.multi and any(o.enabled for o in c.options)]
    errs = []
    for label, layers, w, l, qty, asm in SAMPLES:
        types = [t for t in cfg.orderTypes if t.enabled]
        ot = next((t for t in types if t.assembles == asm and t.makesBoard), types[0])
        req = QuoteRequest(boardW=w, boardL=l, quantity=qty, orderType=ot.name, specials={},
                           **{c.key: _sample_value(c, layers if c.key == "layers" else None) for c in cats})
        try:
            v = run(req, cfg, rules=False).values
        except ValueError as exc:
            errs.append(_err(f"Price tester > {label}", str(exc)))
            continue
        bad = [k for k in ("price_per_board", "total") if not math.isfinite(v[k]) or v[k] <= 0]
        if bad:
            errs.append(_err(f"Price tester > {label}", f"The {bad[0].replace('_', ' ')} came out as {v[bad[0]]:g}, it must be above zero."))
    return errs
