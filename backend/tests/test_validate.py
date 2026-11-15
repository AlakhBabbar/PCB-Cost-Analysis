from backend.services.pricing.defaults import default_data
from backend.services.pricing.validate import check


def errors(edit) -> list[dict]:
    data = default_data()
    edit(data)
    cfg, errs = check(data)
    assert cfg is None and errs
    assert all(set(e) == {"where", "msg"} and e["where"] and e["msg"] for e in errs)
    return errs


def formula(data, key):
    return next(f for f in data["formulas"] if f["key"] == key)


def test_defaults_are_valid():
    cfg, errs = check(default_data())
    assert errs == [] and cfg is not None


def test_broken_formula():
    errs = errors(lambda d: formula(d, "board_area").update(expr="width * (length"))
    assert errs[0]["where"] == "Formulas > Board area (m2)" and "not written correctly" in errs[0]["msg"]


def test_unknown_and_later_names():
    errs = errors(lambda d: formula(d, "board_area").update(expr="width * lenght + total"))
    msgs = " ".join(e["msg"] for e in errs)
    assert '"lenght" is not a setting' in msgs and '"total" is defined further down' in msgs


def test_unsafe_formula():
    errs = errors(lambda d: formula(d, "board_area").update(expr="__import__('os').system('x')"))
    assert errs[0]["where"].startswith("Formulas")


def test_required_line_missing():
    errs = errors(lambda d: d.update(formulas=[f for f in d["formulas"] if f["key"] != "gst"]))
    assert any('"gst" is required' in e["msg"] for e in errs)


def test_bad_target_and_duplicates():
    def edit(d):
        d["categories"][0]["target"] = "nowhere"
        d["categories"][1]["options"].append(dict(d["categories"][1]["options"][0]))
        d["settings"].append(dict(d["settings"][0]))
        d["markupTiers"].append({"maxQty": 5, "markupPct": 1})
    msgs = " ".join(e["msg"] for e in errors(edit))
    assert '"nowhere"' in msgs and 'option "0.6"' in msgs and '"min_board_mm" is used more than once' in msgs
    assert "quantity 5 appears more than once" in msgs


def test_setting_out_of_range():
    def edit(d):
        next(s for s in d["settings"] if s["key"] == "gst_pct")["value"] = 150
        next(s for s in d["settings"] if s["key"] == "inhouse")["value"] = 2
    errs = errors(edit)
    assert {e["where"] for e in errs} == {"Price rules > Tax > GST", "Factory costs > Who makes the bare board > We make bare boards ourselves"}


def test_rule_with_unknown_option():
    errs = errors(lambda d: d["rules"][5].update(when='picked("specials", "nope")'))
    assert errs[0]["where"] == "Buyer options > Build rules > rule 6" and '"nope"' in errs[0]["msg"]


def test_sample_board_must_price_above_zero():
    errs = errors(lambda d: formula(d, "total").update(expr="subtotal * 0"))
    assert errs[0]["where"].startswith("Price tester") and "above zero" in errs[0]["msg"]


def test_divide_by_zero_in_samples():
    errs = errors(lambda d: formula(d, "board_area").update(expr="width / (qty - qty)"))
    assert "Division by zero" in errs[0]["msg"]


def test_shape_errors_are_plain():
    errs = errors(lambda d: d["categories"][0]["options"][0].update(op="pow"))
    assert errs[0]["where"].startswith("Buyer options > Layers")
