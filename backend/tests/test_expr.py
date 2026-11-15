import pytest

from backend.services.pricing.expr import ExprError, evaluate, names, parse

PICKS = {("specials", "impedance")}


def calc(text, **env):
    return evaluate(parse(text), env, lambda c, o: (c, o) in PICKS, lambda c: {"thickness": 1.6}.get(c, 0))


def test_arithmetic_and_logic():
    assert calc("1 + 2 * 3 - 4 / 2") == 5
    assert calc("-(a) + b", a=2, b=5) == 3
    assert calc("a > 1 and b < 1", a=2, b=0) == 1
    assert calc("not a or 0", a=3) == 0
    assert calc("1 < a <= 3", a=3) == 1


def test_functions():
    assert calc("min(3, 1, 2) + max(1, 4)") == 5
    assert calc("floor(2.7) + ceil(2.1) + round(2.456, 2)") == pytest.approx(7.46)
    assert calc('if(picked("specials", "impedance"), 10, 20)') == 10
    assert calc('if(picked("specials", "blindVias"), 10, 20)') == 20
    assert calc('num("thickness") * 2') == 3.2


def test_if_is_lazy():
    assert calc("if(x > 0, 1 / x, 0)", x=0) == 0


def test_divide_by_zero_and_unknown_name():
    with pytest.raises(ExprError, match="zero"):
        calc("1 / x", x=0)
    with pytest.raises(ExprError, match="nope"):
        calc("nope + 1")


@pytest.mark.parametrize("text", [
    "a.b", "__import__('os')", "open('x')", "x(1)", "(lambda: 1)()", "[1, 2]", "'text'", "a ** 2", "a % 2",
    "a if b else c", "x[0]", "f'{a}'", "picked(a, b)", "min(1)", "if(1, 2)", "True", "_secret", "a @ b",
    "max(*a)", "round(x=1)", "num('a', 'b')", "", "1 +", "import os",
])
def test_rejects_unsafe_or_broken(text):
    with pytest.raises(ExprError):
        parse(text)


def test_caps_length_and_depth():
    with pytest.raises(ExprError, match="longer"):
        parse("1 + " * 300 + "1")
    with pytest.raises(ExprError, match="deeply"):
        parse("(" * 45 + "1" + ")" * 45 + " + " + "-" * 45 + "1")


def test_names():
    assert names(parse("if(a > b, min(c, 1), num(\"x\"))")) == {"a", "b", "c"}
