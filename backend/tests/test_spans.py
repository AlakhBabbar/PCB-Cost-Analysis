import pytest

from backend.models.pricing import QuoteRequest
from backend.services.pricing.defaults import default_config
from backend.services.pricing.options import form_options
from backend.services.pricing.quote import calculate_quote
from backend.services.pricing.spans import find, problems, span
from backend.services.pricing.validate import check_config as check

BOARD = dict(boardW=130, boardL=80, quantity=275, layers="2", orderType="Bare PCB", thickness="1.6", copper="1",
             material="FR4 TG130", maskColor="Green", silkscreen="White", finish="HASL", traceSpace="6/6",
             minHole="0.40", ipcStd="IPC-2", testing="FlyingProbe", express="Standard", specials={})


def with_thickness(*rows):
    cfg = default_config()
    cat = next(c for c in cfg.categories if c.key == "thickness")
    cat.options = [cat.options[0].model_copy(update={"name": n, "value": v}) for n, v in rows]
    return cfg


def price(cfg, **over):
    return calculate_quote(QuoteRequest(**{**BOARD, **over}), cfg)


def test_span_reads_numbers_and_ranges():
    assert span("0.6") == (0.6, 0.6) and span("0.6-0.8") == (0.6, 0.8) and span("1 to 2") == (1, 2)
    assert span("thick") is None and span("0.6-") is None


def test_number_categories_are_typed_by_key():
    kinds = {c.key: (c.kind, c.unit) for c in default_config().categories}
    assert kinds["thickness"] == ("number", "mm") and kinds["copper"] == ("number", "oz")
    assert kinds["material"] == ("choice", "") and kinds["layers"][0] == "number"


def test_value_inside_a_range_uses_that_range():
    cfg = with_thickness(("0.6-0.8", 0.8), ("0.8-1.6", 1), ("1.6-3.2", 1.5))
    low, mid, top = price(cfg, thickness="0.7"), price(cfg, thickness="1.2"), price(cfg, thickness="2.4")
    assert low.pricePerBoard < mid.pricePerBoard < top.pricePerBoard
    assert low.summary["Thickness"] == "0.7 mm"


def test_border_value_belongs_to_the_lower_range():
    cfg = with_thickness(("0.6-0.8", 0.8), ("0.8-1.6", 1))
    cat = next(c for c in cfg.categories if c.key == "thickness")
    assert find(cat.options, 0.8).name == "0.6-0.8"
    assert price(cfg, thickness="0.8").pricePerBoard == price(cfg, thickness="0.7").pricePerBoard


def test_value_outside_every_range_is_refused():
    cfg = with_thickness(("0.6-0.8", 0.8), ("1.0-1.6", 1))
    with pytest.raises(ValueError, match="0.9 is not something we make. We make 0.6 to 0.8, 1 to 1.6"):
        price(cfg, thickness="0.9")
    with pytest.raises(ValueError, match="not something we make"):
        price(cfg, thickness="thick")


def test_rules_see_the_typed_value():
    cfg = with_thickness(("0.6-3.2", 1))
    with pytest.raises(ValueError, match="6 layers need"):
        price(cfg, thickness="0.7", layers="6")
    assert price(cfg, thickness="0.9", layers="6").pricePerBoard > 0


@pytest.mark.parametrize("rows, text", [
    ([("0.6-0.8", 1), ("0.7-1.0", 1)], "0.7 to 1 overlaps 0.6 to 0.8"),
    ([("0.6-1.0", 1), ("0.7-0.8", 1)], "overlaps"),
    ([("0.6", 1), ("0.60", 2)], "0.6 is used more than once"),
    ([("0.6-0.8", 1), ("0.8", 2)], "0.8 is already covered by 0.6 to 0.8"),
    ([("0.8-0.6", 1)], "starts above where it ends"),
    ([("thin", 1)], "must be a number"),
])
def test_contradicting_ranges_cannot_be_saved(rows, text):
    msgs = " ".join(e["msg"] for e in check(with_thickness(*rows)))
    assert text in msgs


def test_touching_ranges_read_as_one_stretch():
    cfg = with_thickness(("0.4-0.8", 1), ("0.8-1.6", 1), ("2.0", 1))
    with pytest.raises(ValueError, match="We make 0.4 to 1.6, 2"):
        price(cfg, thickness="5")


def test_touching_ranges_are_fine():
    assert not problems(with_thickness(("0.4-0.6", 1), ("0.6-0.8", 1), ("0.8-1.6", 1)).categories[1].options)
    assert check(with_thickness(("0.4-0.8", 0.9), ("0.8-1.6", 1), ("1.6-3.2", 1.3))) == []


def test_form_gets_number_fields_and_a_default_inside_the_neutral_range():
    cfg = with_thickness(("0.6-0.8", 0.8), ("0.8-1.6", 1), ("1.6-3.2", 1.5))
    form = form_options(cfg)
    assert form["numbers"]["thickness"] == {"unit": "mm", "spans": [(0.6, 0.8), (0.8, 1.6), (1.6, 3.2)], "typed": True}
    assert form["numbers"]["layers"]["typed"] is False and form["defaults"]["thickness"] == "1.6"


def test_exact_value_at_the_start_of_a_range_keeps_its_own_price():
    cfg = with_thickness(("0.6", 0.5), ("0.6-1.6", 1))
    assert check(cfg) == []
    assert price(cfg, thickness="0.6").pricePerBoard < price(cfg, thickness="0.7").pricePerBoard
