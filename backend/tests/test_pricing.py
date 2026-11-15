import pytest

from backend.models.pricing import PricingConfig, QuoteRequest
from backend.services.pricing.defaults import default_config, default_data
from backend.services.pricing.options import default_options, options_from_config
from backend.services.pricing.quote import calculate_quote, public_quote

REF = dict(
    boardW=130, boardL=80, quantity=275, layers="2", orderType="Bare PCB", thickness="1.6", copper="1",
    material="FR4 TG130", maskColor="Green", silkscreen="White", finish="HASL", traceSpace="6/6",
    minHole="0.40", ipcStd="IPC-2", testing="None", express="Standard",
)


def quote(cfg=None, **kw):
    return calculate_quote(QuoteRequest(**{**REF, **kw}), cfg or default_config())


def with_setting(**values) -> PricingConfig:
    cfg = default_config()
    for s in cfg.settings:
        s.value = values.get(s.key, s.value)
    return cfg


def test_reference_board():
    q = quote()
    assert 50 < q.pricePerBoard < 200
    assert q.total == pytest.approx(q.subtotal * 1.18, abs=0.02)
    assert q.engFee == 0 and q.costPerBoard < q.pricePerBoard
    assert q.delivery == "7-10 working days" and not q.manual


def test_lines_show_adjustments():
    lines = {line.key: line for line in quote(thickness="2.0", finish="ENIG-1").lines}
    adj = {a.category: a for a in lines["board_cost"].adjustments}
    assert adj["thickness"].op == "x" and adj["thickness"].delta > 0
    assert adj["finish"].op == "pct" and adj["finish"].delta > 0
    assert [a.category for a in lines["selling_price"].adjustments] == ["express"]


def neutral(cfg: PricingConfig, cat: str, name: str) -> PricingConfig:
    cfg = cfg.model_copy(deep=True)
    o = next(o for c in cfg.categories if c.key == cat for o in c.options if o.name == name)
    o.value, o.orderFee = (1 if o.op == "x" else 0), 0
    return cfg


@pytest.mark.parametrize("cat,name", [(c.key, o.name) for c in default_config().categories for o in c.options
                                      if (o.value != 1 if o.op == "x" else o.value != 0) or o.orderFee])
def test_every_option_moves_the_price_when_bought_in(cat, name):
    cfg = default_config()
    cfg.rules = []
    assert next(s.value for s in cfg.settings if s.key == "inhouse") == 0
    kw = {"specials": {name: True}} if cat == "specials" else {cat: name}
    assert quote(cfg, **kw).total != quote(neutral(cfg, cat, name), **kw).total


def test_engineering_fee_counted_once():
    q = quote(orderType="PCBA")
    assert q.engFee == 1000
    assert q.subtotal == pytest.approx(q.pricePerBoard * q.quantity + q.engFee, abs=q.quantity * 0.005)
    q4 = quote(layers="4", specials={"impedance": True})
    assert q4.engFee == 1000
    q4in = quote(with_setting(inhouse=1), layers="4", specials={"impedance": True})
    assert q4in.engFee == 1000 + 500 + 1000


def test_margin_floor_holds():
    cfg = with_setting(fixed_markup_pct=0)
    q = quote(cfg)
    assert q.pricePerBoard >= q.costPerBoard / 0.90 - 0.01


def test_min_order_value_holds():
    q = quote(with_setting(min_order_value=50000), quantity=2, boardW=20, boardL=20)
    assert q.subtotal == pytest.approx(50000, abs=0.05)


def test_markup_ladder():
    cfg = with_setting(use_markup_ladder=1)
    lines = {line.key: line.value for line in quote(cfg).lines}
    assert lines["markup_pct"] == 58
    assert {line.key: line.value for line in quote(cfg, quantity=1500).lines}["markup_pct"] == 35
    assert {line.key: line.value for line in quote(with_setting(use_markup_ladder=1, max_auto_qty=9000), quantity=5000).lines}["markup_pct"] == 30


def test_inhouse_pcba():
    q = quote(with_setting(inhouse=1), orderType="PCBA")
    lines = {line.key: line.value for line in q.lines}
    assert lines["inhouse_board"] > 0 and lines["labour"] > 0 and lines["parts_cost"] > 0
    assert q.costPerBoard > 0 and q.engFee == 1000


def rule_cases():
    big = {"boardW": 300, "boardL": 300}
    return [
        ({"boardW": 5}, None, "smaller than we can make"),
        ({"boardW": 600}, None, "larger than we price online"),
        (big, {"inhouse": 1}, "does not fit our panel"),
        ({"quantity": 5}, {"min_qty": 10}, "below our minimum"),
        ({"quantity": 3000}, None, "custom price"),
        ({"specials": {"blindVias": True}}, None, "Blind or buried"),
        ({"material": "Aluminum", "layers": "4"}, None, "Aluminium"),
        ({"specials": {"impedance": True}}, None, "Impedance control"),
        ({"material": "High-Freq"}, None, "High frequency"),
        ({"layers": "6", "thickness": "0.6"}, None, "6 layers need"),
        ({"layers": "8", "thickness": "0.8"}, None, "8 layers need"),
        ({"copper": "3", "layers": "4"}, None, "3 oz and 4 oz"),
        ({"traceSpace": "3/3"}, None, "3/3 mil"),
        ({"copper": "3", "traceSpace": "4/4"}, None, "Heavy copper"),
        ({"thickness": "3.2", "minHole": "0.25"}, None, "hole is too small"),
    ]


@pytest.mark.parametrize("kw,settings,msg", rule_cases())
def test_default_rules_fire(kw, settings, msg):
    cfg = with_setting(**(settings or {}))
    rule = next(r for r in cfg.rules if msg in r.message)
    try:
        q = quote(cfg, **kw)
    except ValueError as exc:
        assert rule.action == "block" and str(exc) == rule.message
        return
    assert rule.action == "manual" and q.manual and q.manualReason == rule.message
    assert q.pricePerBoard == q.total == q.subtotal == 0


def test_assembly_review_rule_when_enabled():
    cfg = default_config()
    assert quote(cfg, orderType="PCBA").manual is False
    cfg.rules[-1].enabled = True
    q = quote(cfg, orderType="PCBA")
    assert q.manual and "parts list" in q.manualReason


def test_invalid_options():
    with pytest.raises(ValueError, match="Layers"):
        quote(layers="3")
    with pytest.raises(ValueError, match="Special"):
        quote(specials={"bogus": True})
    with pytest.raises(ValueError, match="Order type"):
        quote(orderType="Nope")
    assert quote(specials={"bogus": False}).total > 0


def test_disabled_option_is_rejected():
    cfg = default_config()
    cfg.categories[0].options[1].enabled = False
    with pytest.raises(ValueError, match="Layers"):
        quote(cfg)
    assert options_from_config(cfg)["layers"] == ["1", "4", "6", "8"]


def test_public_quote_hides_admin_fields():
    out = public_quote(quote()).model_dump()
    assert not {"costPerBoard", "lines", "profit"} & set(out)
    assert {"pricePerBoard", "manual", "manualReason", "summary"} <= set(out)


def test_summary_uses_labels():
    s = quote(layers="4", specials={"impedance": True, "goldFingers": True}).summary
    assert s["Special reqs"] == "Impedance control, Gold fingers"
    assert s["Order type"] == "Bare PCB" and s["Material"] == "FR4 TG130" and s["Silkscreen"] == "White"
    assert s["Thickness"] == "1.6 mm" and quote().summary["Special reqs"] == "None"


def test_options():
    opts = options_from_config(default_config())
    assert opts["orderType"] == ["Bare PCB", "PCBA", "Assembly Only"]
    picks = default_options(default_config())
    assert (picks["layers"], picks["thickness"], picks["copper"]) == ("2", "1.6", "1") and "specials" not in picks
    assert list(opts) == ["orderType", *(c["key"] for c in default_data()["categories"])]
