import re

from backend.models.pricing import NUMERIC

_SPAN = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*(?:(?:-|to)\s*(\d+(?:\.\d+)?))?\s*$")


def span(name: str) -> tuple[float, float] | None:
    """An option name of a number category as (from, to): "0.6" or "0.6-0.8"."""
    m = _SPAN.match(name)
    if not m:
        return None
    lo = float(m.group(1))
    return lo, float(m.group(2)) if m.group(2) else lo


def number(text) -> float | None:
    try:
        return float(text)
    except (TypeError, ValueError):
        return None


def show(s: tuple[float, float]) -> str:
    return f"{s[0]:g}" if s[0] == s[1] else f"{s[0]:g} to {s[1]:g}"


def find(options: list, value: float):
    """The option whose range holds the value. A value on a shared border belongs to the lower range."""
    hits = sorted((s, i) for i, o in enumerate(options) if (s := span(o.name)) and s[0] <= value <= s[1])
    return options[hits[0][1]] if hits else None


def offered(options: list) -> str:
    merged = []  # ranges that touch read as one stretch
    for lo, hi in sorted(s for o in options if (s := span(o.name))):
        if merged and lo <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(hi, merged[-1][1]))
        else:
            merged.append((lo, hi))
    return ", ".join(show(s) for s in merged)


def problems(options: list) -> list[str]:
    """Plain reasons the numbers or ranges of one category contradict each other."""
    out, spans = [], []
    for o in options:
        s = span(o.name)
        if not s:
            out.append(f'"{o.name}" must be a number, or a range such as 0.6-0.8.')
        elif s[0] > s[1]:
            out.append(f'The range "{o.name}" starts above where it ends.')
        else:
            spans.append(s)
    spans.sort()
    for a, b in zip(spans, spans[1:]):
        if a == b:
            out.append(f"{show(b)} is used more than once.")
        elif b[0] < a[1]:
            out.append(f"{show(b)} overlaps {show(a)}. Ranges may only touch at their ends.")
        elif b[0] == b[1] == a[1]:  # a single value on the top end of a range would never be used
            out.append(f"{show(b)} is already covered by {show(a)}.")
    return out


__all__ = ["NUMERIC", "span", "number", "show", "find", "offered", "problems"]
