import re

TOLERANCE_MM = 2


def _num(v) -> float | None:
    m = re.match(r"\s*(\d+(?:\.\d+)?)", str(v))
    return float(m.group(1)) if m else None


def review_reasons(req, upload: dict | None) -> list[str]:
    """Plain reasons the typed specs disagree with the parsed file. Empty means it matches."""
    if upload is None:
        return ["The file details were not on record. Check the file by hand."]
    out = []
    w, h = upload.get("width_mm"), upload.get("height_mm")
    if w and h:
        typed, found = sorted((req.boardW, req.boardL)), sorted((w, h))
        if any(abs(a - b) > TOLERANCE_MM for a, b in zip(typed, found)):
            out.append(f"Size typed as {req.boardW:g} x {req.boardL:g} mm, the file measures {w:.1f} x {h:.1f} mm.")
    layers, found_layers = _num(req.layers), upload.get("copper_layers")
    if layers and found_layers and int(layers) != found_layers:
        out.append(f"{int(layers)} layers chosen, the file has {found_layers} copper layers.")
    hole, drill = _num(req.minHole), upload.get("min_drill_mm")
    if hole and drill and drill < hole - 0.005:
        out.append(f"Smallest hole in the file is {drill:.2f} mm, smaller than the chosen {hole:.2f} mm.")
    return out
