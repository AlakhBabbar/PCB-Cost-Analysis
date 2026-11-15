from copy import deepcopy

from backend.models.pricing import PricingConfig
from backend.services.pricing.default_settings import default_settings

REQUIRED = ("cost_per_board", "price_per_board", "engineering_fee", "subtotal", "gst", "total")
CATEGORY_KEYS = ("layers", "thickness", "copper", "material", "finish", "traceSpace", "ipcStd",
                 "minHole", "maskColor", "silkscreen", "testing", "specials", "express")


def _cat(key, label, op, options, help, target="board_cost", multi=False):
    opts = [{"name": o[0], "op": op, "value": o[1], "orderFee": o[2] if len(o) > 2 else 0,
             "label": o[3] if len(o) > 3 else "", "note": o[4] if len(o) > 4 else ""} for o in options]
    return {"key": key, "label": label, "target": target, "multi": multi, "help": help, "options": opts}


CATEGORIES = [
    _cat("layers", "Layers", "x", [("1", 0.7), ("2", 1), ("4", 1.8), ("6", 2.6), ("8", 3.4)],
         "Multiplies the board cost. 1.8 makes a 100 board cost 180."),
    _cat("thickness", "Board thickness (mm)", "x",
         [("0.6", 0.77), ("0.8", 0.82), ("1.0", 0.86), ("1.2", 0.91), ("1.6", 1), ("2.0", 1.14), ("2.4", 1.27), ("3.2", 1.45)],
         "Multiplies the board cost. 1.14 makes 100 into 114."),
    _cat("copper", "Copper weight (oz)", "x", [("0.5", 0.95), ("1", 1), ("1.5", 1.15), ("2", 1.35), ("3", 1.7), ("4", 2.2)],
         "Multiplies the board cost. 1.35 makes 100 into 135."),
    _cat("material", "Material", "x",
         [("FR4 TG130", 1), ("FR4 TG150", 1.08), ("FR4 TG170", 1.15), ("High-Freq", 4), ("Aluminum", 1.3)],
         "Multiplies the board cost. 1.08 makes 100 into 108."),
    _cat("finish", "Surface finish", "pct",
         [("HASL", 0), ("HASL-LF", 8), ("ENIG-1", 20), ("ENIG-2", 28), ("ENIG-3", 35), ("ImmTin", 12), ("ImmSilver", 15), ("OSP", -5)],
         "Adds a percent to the board cost. 20 makes 100 into 120."),
    _cat("traceSpace", "Trace and space (mil)", "x", [("6/6", 1), ("5/5", 1.1), ("4/4", 1.25), ("3/3", 1.5)],
         "Multiplies the board cost. 1.25 makes 100 into 125."),
    _cat("ipcStd", "IPC class", "x", [("IPC-2", 1), ("IPC-3", 1.15)], "Multiplies the board cost. 1.15 makes 100 into 115."),
    _cat("minHole", "Smallest hole (mm)", "add", [("0.40", 0), ("0.30", 3), ("0.25", 8), ("0.20", 15), ("0.15", 25)],
         "Adds rupees per board. 8 makes 100 into 108."),
    _cat("maskColor", "Solder mask colour", "add",
         [("Green", 0), ("Blue", 2), ("Red", 2), ("Black", 3), ("White", 3), ("Yellow", 2), ("Purple", 5)],
         "Adds rupees per board. 3 makes 100 into 103."),
    _cat("silkscreen", "Silkscreen colour", "add", [("White", 0), ("Black", 0), ("Yellow", 0), ("None", 0)],
         "Adds rupees per board. 0 changes nothing."),
    _cat("testing", "Electrical test", "add", [("FlyingProbe", 0), ("Fixture", 8), ("None", 0)],
         "Adds rupees per board. 8 makes 100 into 108."),
    _cat("specials", "Special requirements", "pct", [
        ("impedance", 12, 1000, "Impedance control"), ("blindVias", 25, 2000, "Blind / buried vias"),
        ("goldFingers", 10, 500, "Gold fingers"), ("halfHole", 8, 500, "Castellated holes"),
        ("resinPlug", 10, 500, "Resin plugged vias"), ("metalEdge", 15, 500, "Edge plating"),
        ("halogenFree", 8, 500, "Halogen free"),
    ], "Each pick adds a percent to the board cost and a one time fee. 12 and 1000 make 100 into 112 plus 1000 per order.", multi=True),
    _cat("express", "Production speed", "x",
         [("Standard", 1, 0, "", "7-10 working days"), ("Urgent", 1.5, 0, "", "3-5 working days")],
         "Multiplies the selling price. 1.5 makes 120 into 180.", target="selling_price"),
]

ORDER_TYPES = [
    {"name": "Bare PCB", "makesBoard": True, "assembles": False},
    {"name": "PCBA", "makesBoard": True, "assembles": True},
    {"name": "Assembly Only", "makesBoard": False, "assembles": True},
]

LADDER = [(5, 100), (10, 90), (20, 80), (50, 72), (100, 65), (300, 58), (500, 50), (1000, 42), (2000, 35)]

FORMULAS = [
    ("panel", "boards_per_row", "Boards across the panel",
     "max(floor((panel_width - 2*edge_margin + routing_gap) / (width + routing_gap)), 0)", "How many boards fit side by side."),
    ("panel", "boards_per_col", "Boards down the panel",
     "max(floor((panel_length - 2*edge_margin + routing_gap) / (length + routing_gap)), 0)", "How many boards fit top to bottom."),
    ("panel", "boards_per_panel", "Boards per panel", "boards_per_row * boards_per_col", "Boards cut from one panel."),
    ("panel", "board_area", "Board area (m2)", "width * length / 1000000", "Size of one board in square metres."),
    ("panel", "material_area", "Panel area per board (m2)",
     "if(boards_per_panel > 0, panel_width * panel_length / 1000000 / boards_per_panel, board_area)",
     "Share of the panel each board uses, waste included."),
    ("board", "inhouse_board", "In house board cost", "material_area * (laminate_rate + process_rate) + drill_wear",
     "Laminate, process and drill wear for one board we make."),
    ("board", "supplier_board", "Bought in board cost", "supplier_per_board + board_area * supplier_rate + supplier_order_fee / qty",
     "What one board costs from the supplier."),
    ("board", "board_cost", "Bare board cost", "makes_board * if(inhouse, inhouse_board, supplier_board)",
     "The bare board, before the buyer's options are applied."),
    ("assembly", "parts_cost", "Parts cost", "assembles * parts_per_board * (1 + parts_wastage_pct/100) * (1 + parts_freight_pct/100)",
     "Components per assembled board with wastage and freight."),
    ("assembly", "we_do_work", "Work done in our factory", "max(inhouse, assembles)", "1 when our line touches the order, else 0."),
    ("assembly", "consumables", "Consumables",
     "we_do_work * (solder_paste + other_consumables) * if(assembles, 1, bare_consumables_share_pct/100)",
     "Paste and other consumables per board."),
    ("running", "yield_rate", "Good board rate", "if(we_do_work, min(max(yield_pct, 1), 100) / 100, 1)",
     "Share of boards that pass, as a fraction."),
    ("running", "boards_made", "Boards made", "qty / yield_rate", "Boards started so enough pass."),
    ("running", "labour_month", "Labour per month",
     "(operators_per_shift * shifts * operator_salary + (qc_salary + supervisor_salary) * shifts) * (1 + benefits_pct/100)",
     "All salaries with benefits."),
    ("running", "power_month", "Power per month",
     "load_kw * work_days * shifts * run_hours * utilisation_pct/100 * power_tariff + lighting + nitrogen + water_effluent",
     "Machine power plus fixed utilities."),
    ("running", "overheads_month", "Overheads per month",
     "rent + admin_salaries + marketing + software + maintenance + insurance + interest + misc + depreciation",
     "Every fixed monthly cost."),
    ("running", "labour", "Labour per board",
     "we_do_work * labour_month * order_share_pct/100 / boards_made * (1 + rework_pct/100) * if(inhouse, 1, outsourced_labour_share_pct/100)",
     "This order's share of labour, per board."),
    ("running", "power", "Power per board",
     "we_do_work * power_month * order_share_pct/100 / boards_made * if(inhouse, 1, outsourced_power_share_pct/100)",
     "This order's share of power, per board."),
    ("running", "overheads", "Overheads per board", "we_do_work * overheads_month * order_share_pct/100 / boards_made",
     "This order's share of overheads, per board."),
    ("running", "packaging", "Packaging per board",
     "if(assembles, esd_bag + carton + shipping_per_board, (esd_bag + inhouse * shipping_per_board) * bare_packaging_share_pct/100)",
     "Bag, carton and shipping."),
    ("cost", "unit_cost", "Running cost per board",
     "(board_cost + parts_cost + consumables + labour + power + overheads + packaging) / yield_rate",
     "Everything per board, with failed boards paid for."),
    ("cost", "one_time_cost", "One time cost per order",
     "inhouse * (tooling + cam_hours * supervisor_salary / cam_hours_per_month) + compliance_fee",
     "Tooling, CAM time and compliance for the order."),
    ("cost", "cost_per_board", "Cost per board", "unit_cost + one_time_cost / qty", "What one board really costs us."),
    ("price", "markup_pct", "Markup used", "if(use_markup_ladder, ladder_markup_pct, fixed_markup_pct)", "Ladder or fixed markup."),
    ("price", "selling_price", "Selling price", "cost_per_board * (1 + markup_pct/100)", "Cost plus markup, then production speed."),
    ("price", "bank_and_warranty", "Bank and warranty", "selling_price * (bank_charges_pct + warranty_pct) / 100",
     "Payment fees and warranty reserve per board."),
    ("price", "engineering_fee", "Engineering fee",
     "we_do_work * (base_engineering_fee + extra_layer_fee * max(layers/2 - 1, 0)) + option_fees",
     "One time fee per order, plus one time fees of chosen options."),
    ("price", "margin_floor", "Lowest allowed price", "cost_per_board / (1 - min_margin_pct/100)", "Price that keeps the lowest margin."),
    ("price", "price_per_board", "Price per board",
     "max(selling_price + bank_and_warranty, margin_floor, (min_order_value - engineering_fee) / qty)",
     "The higher of the normal price, the margin floor and the minimum order."),
    ("price", "subtotal", "Subtotal", "price_per_board * qty + engineering_fee", "All boards plus the engineering fee."),
    ("price", "gst", "GST", "subtotal * gst_pct / 100", "Tax on the subtotal."),
    ("price", "total", "Total", "subtotal + gst", "What the buyer pays."),
]

RULES = [
    ("width < min_board_mm or length < min_board_mm", "block", "This board is smaller than we can make."),
    ("max(width, length) > max_board_mm", "manual", "This board is larger than we price online."),
    ("inhouse and boards_per_panel < 1", "manual", "This board does not fit our panel."),
    ("qty < min_qty", "block", "Quantity is below our minimum."),
    ("qty > max_auto_qty", "manual", "Large orders get a custom price."),
    ('picked("specials", "blindVias") and layers < 4', "block", "Blind or buried vias need 4 or more layers."),
    ('picked("material", "Aluminum") and layers > 2', "block", "Aluminium boards are 1 or 2 layers."),
    ('picked("specials", "impedance") and layers < 4', "block", "Impedance control needs 4 or more layers."),
    ('picked("material", "High-Freq")', "manual", "High frequency boards are quoted by our team."),
    ('layers >= 6 and num("thickness") < 0.8', "block", "6 layers need a 0.8 mm or thicker board."),
    ('layers >= 8 and num("thickness") < 1.0', "block", "8 layers need a 1.0 mm or thicker board."),
    ('num("copper") >= 3 and layers > 2', "block", "3 oz and 4 oz copper are for 1 and 2 layer boards."),
    ('num("traceSpace") < 4 and layers < 4', "block", "3/3 mil traces need 4 or more layers."),
    ('num("copper") >= 3 and num("traceSpace") < 5', "block", "Heavy copper cannot be combined with fine traces."),
    ('num("minHole") > 0 and num("thickness") / num("minHole") > 10', "block", "That hole is too small for this board thickness."),
    ("assembles", "manual", "Assembly orders are priced after we review your parts list."),
]


def default_data() -> dict:
    return {
        "settings": default_settings(),
        "categories": deepcopy(CATEGORIES),
        "orderTypes": deepcopy(ORDER_TYPES),
        "markupTiers": [{"maxQty": q, "markupPct": m} for q, m in LADDER],
        "formulas": [{"key": k, "label": label, "section": sec, "expr": e, "help": h, "locked": k in REQUIRED}
                     for sec, k, label, e, h in FORMULAS],
        "rules": [{"id": f"r{i + 1}", "when": w, "action": a, "message": m, "enabled": i != len(RULES) - 1}
                  for i, (w, a, m) in enumerate(RULES)],
    }


def default_config() -> PricingConfig:
    return PricingConfig.model_validate(default_data())
