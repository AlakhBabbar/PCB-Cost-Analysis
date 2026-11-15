import ast
import math
import re
from functools import lru_cache

MAX_LEN = 600
MAX_DEPTH = 40
IF = "_if"
STRING_FUNCS = {"picked": 2, "num": 1}
MATH = {"min", "max", "floor", "ceil", "round"}
FUNCS = {*MATH, *STRING_FUNCS, IF}
BIN = {ast.Add: lambda a, b: a + b, ast.Sub: lambda a, b: a - b, ast.Mult: lambda a, b: a * b, ast.Div: lambda a, b: a / b}
CMP = {ast.Lt: lambda a, b: a < b, ast.LtE: lambda a, b: a <= b, ast.Gt: lambda a, b: a > b,
       ast.GtE: lambda a, b: a >= b, ast.Eq: lambda a, b: a == b, ast.NotEq: lambda a, b: a != b}


class ExprError(ValueError):
    pass


@lru_cache(maxsize=1024)
def parse(text: str) -> ast.Expression:
    if not text or not text.strip():
        raise ExprError("The formula is empty.")
    if len(text) > MAX_LEN:
        raise ExprError(f"The formula is longer than {MAX_LEN} characters.")
    try:
        tree = ast.parse(re.sub(r"\bif\s*\(", IF + "(", text.strip()), mode="eval")
    except SyntaxError:
        raise ExprError("The formula is not written correctly. Check brackets, commas and operators.") from None
    _check(tree.body, 0)
    return tree


def _check(n: ast.AST, depth: int) -> None:
    if depth > MAX_DEPTH:
        raise ExprError("The formula is nested too deeply.")
    d = depth + 1
    if isinstance(n, ast.Constant):
        if isinstance(n.value, bool) or not isinstance(n.value, (int, float)):
            raise ExprError("Text in quotes is only allowed inside picked() and num().")
    elif isinstance(n, ast.Name):
        if n.id.startswith("_") or n.id in FUNCS:
            raise ExprError(f'"{n.id}" cannot be used as a name.')
    elif isinstance(n, ast.BinOp) and type(n.op) in BIN:
        _check(n.left, d)
        _check(n.right, d)
    elif isinstance(n, ast.UnaryOp) and isinstance(n.op, (ast.USub, ast.UAdd, ast.Not)):
        _check(n.operand, d)
    elif isinstance(n, ast.BoolOp):
        for v in n.values:
            _check(v, d)
    elif isinstance(n, ast.Compare) and all(type(o) in CMP for o in n.ops):
        for v in (n.left, *n.comparators):
            _check(v, d)
    elif isinstance(n, ast.Call):
        _check_call(n, d)
    else:
        raise ExprError("The formula uses something that is not allowed. Use numbers, names, + - * /, comparisons and the listed functions.")


def _check_call(n: ast.Call, d: int) -> None:
    name = n.func.id if isinstance(n.func, ast.Name) else None
    if name not in FUNCS or n.keywords:
        raise ExprError("Only these functions are allowed: min, max, floor, ceil, round, if, picked, num.")
    shown = "if" if name == IF else name
    if name in STRING_FUNCS:
        if len(n.args) != STRING_FUNCS[name] or not all(isinstance(a, ast.Constant) and isinstance(a.value, str) for a in n.args):
            raise ExprError(f'{shown}() needs {STRING_FUNCS[name]} text value(s) in quotes, like picked("specials", "impedance").')
        return
    count = len(n.args)
    if (name == IF and count != 3) or (name in ("min", "max") and count < 2) or (name in ("floor", "ceil") and count != 1) \
            or (name == "round" and count not in (1, 2)):
        raise ExprError(f"{shown}() has the wrong number of values.")
    for a in n.args:
        _check(a, d)


def names(tree: ast.Expression) -> set[str]:
    return {n.id for n in ast.walk(tree) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load) and n.id not in FUNCS}


def string_calls(tree: ast.Expression) -> list[tuple[str, list[str]]]:
    return [(n.func.id, [a.value for a in n.args]) for n in ast.walk(tree)
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in STRING_FUNCS]


def evaluate(tree: ast.Expression, env: dict, picked, num) -> float:
    try:
        v = float(_eval(tree.body, env, picked, num))
    except ExprError:
        raise
    except (ArithmeticError, ValueError):
        raise ExprError("The result is too large or not a number.") from None
    if not math.isfinite(v):
        raise ExprError("The result is too large or not a number.")
    return v


def _eval(n, env, picked, num):
    ev = lambda x: _eval(x, env, picked, num)
    if isinstance(n, ast.Constant):
        return n.value
    if isinstance(n, ast.Name):
        if n.id not in env:
            raise ExprError(f'"{n.id}" is not a setting, input or earlier line.')
        return env[n.id]
    if isinstance(n, ast.BinOp):
        a, b = ev(n.left), ev(n.right)
        if isinstance(n.op, ast.Div) and b == 0:
            raise ExprError("Division by zero.")
        return BIN[type(n.op)](a, b)
    if isinstance(n, ast.UnaryOp):
        v = ev(n.operand)
        return (0 if v else 1) if isinstance(n.op, ast.Not) else -v if isinstance(n.op, ast.USub) else v
    if isinstance(n, ast.BoolOp):
        want = isinstance(n.op, ast.Or)
        return 1 if any(bool(ev(v)) == want for v in n.values) == want else 0
    if isinstance(n, ast.Compare):
        left = ev(n.left)
        for op, c in zip(n.ops, n.comparators):
            right = ev(c)
            if not CMP[type(op)](left, right):
                return 0
            left = right
        return 1
    name, args = n.func.id, n.args
    if name == IF:
        return ev(args[1]) if ev(args[0]) else ev(args[2])
    if name == "picked":
        return 1 if picked(args[0].value, args[1].value) else 0
    if name == "num":
        return num(args[0].value)
    vals = [ev(a) for a in args]
    if name == "round":
        return round(vals[0], int(vals[1]) if len(vals) > 1 else 0)
    return getattr(math, name)(*vals) if name in ("floor", "ceil") else (min if name == "min" else max)(vals)
