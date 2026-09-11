"""Shared fail-closed clearance and bounded arithmetic for SENTINEL tools."""
from __future__ import annotations

import ast
import math
import operator

ROLE_CLEARANCE = {"viewer": 1, "operator": 2, "analyst": 2, "engineer": 3,
                  "auditor": 3, "manager": 4, "executive": 5, "admin": 6}
CLEARANCE = {**ROLE_CLEARANCE, "public": 1, "internal": 2, "confidential": 4, "restricted": 6}


def can_read(role: str, clearance: str = "internal") -> bool:
    return role in ROLE_CLEARANCE and clearance in CLEARANCE and ROLE_CLEARANCE[role] >= CLEARANCE[clearance]


def calculate(formula: str, operands: dict[str, float]) -> float:
    """Interpret arithmetic only; no Python execution, attributes, imports or loops."""
    if not isinstance(formula, str) or len(formula) > 512 or len(operands) > 32:
        raise ValueError("Calculation exceeds size limits")
    values = {}
    for key, value in operands.items():
        if not key.isidentifier() or key.startswith("_") or isinstance(value, bool):
            raise ValueError("Invalid operand")
        values[key] = float(value)
        if not math.isfinite(values[key]) or abs(values[key]) > 1e100:
            raise ValueError("Operand outside finite bounds")
    tree = ast.parse(formula, mode="eval")
    if sum(1 for _ in ast.walk(tree)) > 100:
        raise ValueError("Formula is too complex")
    binary = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
              ast.Div: operator.truediv, ast.Mod: operator.mod, ast.FloorDiv: operator.floordiv}
    functions = {"abs": abs, "round": round, "min": min, "max": max}

    def visit(node):
        if isinstance(node, ast.Expression):
            value = visit(node.body)
        elif isinstance(node, ast.Constant) and type(node.value) in (int, float):
            value = float(node.value)
        elif isinstance(node, ast.Name) and node.id in values:
            value = values[node.id]
        elif isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = visit(node.operand) * (-1 if isinstance(node.op, ast.USub) else 1)
        elif isinstance(node, ast.BinOp) and type(node.op) in binary:
            value = binary[type(node.op)](visit(node.left), visit(node.right))
        elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.Pow):
            left, right = visit(node.left), visit(node.right)
            if abs(right) > 16:
                raise ValueError("Exponent exceeds 16")
            value = left ** right
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in functions and not node.keywords and 1 <= len(node.args) <= 8:
            args = [visit(arg) for arg in node.args]
            if node.func.id == "round" and len(args) == 2:
                if not args[1].is_integer() or abs(args[1]) > 15:
                    raise ValueError("Invalid rounding precision")
                args[1] = int(args[1])
            value = functions[node.func.id](*args)
        else:
            raise ValueError("Only arithmetic and abs/round/min/max are allowed")
        if isinstance(value, complex) or not math.isfinite(value) or abs(value) > 1e100:
            raise ValueError("Result outside finite bounds")
        return float(value)

    return visit(tree)
