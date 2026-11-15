def _s(key, label, unit, value, help, lo=0, hi=None, kind="number"):
    if hi is None and unit == "%":
        hi = 100
    if kind == "switch":
        lo, hi = 0, 1
    return {"key": key, "label": label, "unit": unit, "kind": kind, "value": value, "min": lo, "max": hi, "help": help}


SECTIONS = {
    ("limits", "Size and quantity"): [
        _s("min_board_mm", "Smallest board side", "mm", 10, "Boards with a side under this are refused. 10 means a 8 x 40 mm board is refused.", hi=1000),
        _s("max_board_mm", "Largest board side", "mm", 500, "Boards with a side over this go to manual quote. 500 means a 520 x 100 mm board is quoted by hand.", hi=5000),
        _s("min_qty", "Smallest order", "pcs", 1, "Orders below this many boards are refused. 5 means an order of 3 is refused.", lo=1),
        _s("max_auto_qty", "Largest online order", "pcs", 2000, "Orders above this many boards get a custom price. 2000 means 2500 boards are quoted by hand.", lo=1),
    ],
    ("price", "Markup"): [
        _s("use_markup_ladder", "Use the quantity ladder", "", 0, "On: markup comes from the quantity ladder. Off: every order uses the fixed markup.", kind="switch"),
        _s("fixed_markup_pct", "Fixed markup", "%", 15, "Added on top of cost when the ladder is off. 15 turns a 100 cost into 115.", hi=1000),
        _s("markup_above_ladder_pct", "Markup above the ladder", "%", 30, "Used when the quantity is bigger than the last ladder step. 30 turns 100 into 130.", hi=1000),
    ],
    ("price", "Safety nets"): [
        _s("min_margin_pct", "Lowest margin allowed", "%", 10, "The price never drops below this margin. 10 means a 90 cost sells for at least 100.", hi=95),
        _s("min_order_value", "Smallest order value", "INR", 1000, "Orders are raised to at least this before tax. 1000 means 5 boards at 50 are charged 1000 in total."),
    ],
    ("price", "Fees"): [
        _s("bank_charges_pct", "Bank charges", "%", 0.5, "Added to the selling price to cover payment fees. 0.5 adds 0.50 on a 100 price."),
        _s("warranty_pct", "Warranty reserve", "%", 1, "Added to the selling price to cover returns. 1 adds 1 on a 100 price."),
        _s("base_engineering_fee", "Engineering fee", "INR", 1000, "One time fee per order when we build or assemble. 1000 adds 1000 to the order."),
        _s("extra_layer_fee", "Fee per extra layer pair", "INR", 500, "Added to the engineering fee for each layer pair above 2. A 6 layer board adds 2 x 500."),
        _s("compliance_fee", "Compliance cost per order", "INR", 500, "Paperwork and checks for each order, spread over the boards. 500 over 100 boards adds 5 each."),
    ],
    ("price", "Tax"): [
        _s("gst_pct", "GST", "%", 18, "Tax added to the subtotal. 18 adds 180 to a 1000 order."),
    ],
    ("factory", "Who makes the bare board"): [
        _s("inhouse", "We make bare boards ourselves", "", 0, "On: bare boards use our own material and running costs. Off: we buy them from a supplier.", kind="switch"),
        _s("supplier_per_board", "Supplier price per board", "INR", 42, "What the supplier charges for each board before area. 42 means every board costs at least 42."),
        _s("supplier_rate", "Supplier price per area", "INR/m2", 1200, "Supplier charge per square metre of board. 1200 makes a 100 x 100 mm board cost 12 more."),
        _s("supplier_order_fee", "Supplier fee per order", "INR", 1750, "One time supplier fee spread over the boards. 1750 over 100 boards adds 17.5 each."),
    ],
    ("factory", "Panel"): [
        _s("panel_width", "Panel width", "mm", 250, "Width of the working panel the boards are cut from. 250 fits nine 70 mm boards across three rows.", lo=1, hi=2000),
        _s("panel_length", "Panel length", "mm", 250, "Length of the working panel. 250 by 250 is a common small panel.", lo=1, hi=2000),
        _s("routing_gap", "Gap between boards", "mm", 5, "Space left for the router between boards. 5 means boards sit 5 mm apart.", hi=100),
        _s("edge_margin", "Panel edge margin", "mm", 10, "Border kept clear on every panel edge. 10 leaves 230 mm usable on a 250 mm panel.", hi=500),
        _s("yield_pct", "Good boards", "%", 94, "Share of boards that pass. 94 means we make about 106 boards to ship 100.", lo=1),
    ],
    ("factory", "Materials"): [
        _s("laminate_rate", "Laminate cost", "INR/m2", 1600, "Raw laminate per square metre of panel. 1600 makes a 0.0625 m2 panel cost 100."),
        _s("process_rate", "Process cost", "INR/m2", 900, "Plating, etching and mask per square metre. 900 adds 56 to a 0.0625 m2 panel."),
        _s("drill_wear", "Drill and router wear", "INR", 3, "Tool wear per board we make. 3 adds 3 to every in house board."),
    ],
    ("factory", "Parts and consumables"): [
        _s("parts_per_board", "Parts per board", "INR", 80, "Component cost per assembled board. 80 adds 80 before wastage and freight."),
        _s("parts_wastage_pct", "Parts wastage", "%", 2, "Extra parts lost in assembly. 2 turns 80 into 81.60."),
        _s("parts_freight_pct", "Parts freight", "%", 3, "Shipping for the parts. 3 turns 80 into 82.40."),
        _s("solder_paste", "Solder paste per board", "INR", 8, "Paste used on each assembled board. 8 adds 8."),
        _s("other_consumables", "Other consumables per board", "INR", 12, "Flux, wipes, gloves and so on per board. 12 adds 12."),
        _s("bare_consumables_share_pct", "Consumables share for bare boards", "%", 40, "Part of the consumables a bare board uses. 40 means 20 of consumables becomes 8."),
    ],
    ("factory", "Labour"): [
        _s("operators_per_shift", "Operators per shift", "", 1, "People on the line each shift. 2 doubles the operator salaries."),
        _s("shifts", "Shifts per day", "", 1, "Shifts run each working day. 2 doubles labour and running hours.", hi=3),
        _s("work_days", "Working days per month", "", 26, "Days the factory runs each month. 26 is six days a week.", hi=31),
        _s("operator_salary", "Operator salary", "INR/month", 18000, "Monthly pay for one operator. 18000 per operator per shift."),
        _s("qc_salary", "Quality checker salary", "INR/month", 0, "Monthly pay for quality checks per shift. 0 if operators check their own work."),
        _s("supervisor_salary", "Supervisor salary", "INR/month", 0, "Monthly pay for a supervisor per shift. Also sets the CAM hour cost."),
        _s("benefits_pct", "Benefits on salaries", "%", 18, "PF, ESI and bonus on top of salaries. 18 turns 18000 into 21240."),
        _s("rework_pct", "Rework time", "%", 5, "Extra labour for fixing boards. 5 adds 5 on 100 of labour."),
        _s("cam_hours", "CAM hours per order", "hrs", 2, "Time spent preparing files for each in house order. 2 hours at the supervisor rate."),
        _s("cam_hours_per_month", "Paid hours per month", "hrs", 160, "Hours used to turn a monthly salary into an hourly rate. 160 makes 16000 a month 100 an hour.", lo=1),
    ],
    ("factory", "Power"): [
        _s("load_kw", "Machine load", "kW", 15, "Power drawn by the line when running. 15 kW for 8 hours uses 120 kWh at full load."),
        _s("run_hours", "Running hours per shift", "hrs", 8, "Hours the machines run each shift. 8 is a full shift.", hi=24),
        _s("utilisation_pct", "Machine utilisation", "%", 60, "How much of the time the machines really draw power. 60 turns 120 kWh into 72 kWh."),
        _s("power_tariff", "Power tariff", "INR", 8.5, "Price per kWh. 8.5 makes 100 kWh cost 850."),
        _s("lighting", "Lighting and AC", "INR/month", 5000, "Monthly lighting and cooling bill. 5000 a month."),
        _s("nitrogen", "Nitrogen", "INR/month", 2000, "Monthly nitrogen for reflow. 2000 a month."),
        _s("water_effluent", "Water and effluent", "INR/month", 2000, "Monthly water and waste treatment. 2000 a month."),
    ],
    ("factory", "Overheads"): [
        _s("rent", "Rent", "INR/month", 15000, "Monthly rent for the factory. 15000 a month."),
        _s("admin_salaries", "Office salaries", "INR/month", 10000, "Monthly pay for office staff. 10000 a month."),
        _s("marketing", "Marketing", "INR/month", 5000, "Monthly marketing spend. 5000 a month."),
        _s("software", "Software", "INR/month", 3000, "Monthly software licences. 3000 a month."),
        _s("maintenance", "Maintenance", "INR/month", 3000, "Monthly machine upkeep. 3000 a month."),
        _s("insurance", "Insurance", "INR/month", 2000, "Monthly insurance. 2000 a month."),
        _s("interest", "Loan interest", "INR/month", 5000, "Monthly interest on loans. 5000 a month."),
        _s("misc", "Other costs", "INR/month", 3000, "Anything else paid every month. 3000 a month."),
        _s("depreciation", "Machine depreciation", "INR/month", 8000, "Monthly wear on machines. 8000 a month."),
        _s("order_share_pct", "Monthly costs per order", "%", 15, "Part of the monthly costs one order carries. 15 means an order carries 15 of every 100."),
        _s("outsourced_labour_share_pct", "Labour share when bought in", "%", 60, "Labour still needed when the bare board is bought. 60 means 100 of labour becomes 60."),
        _s("outsourced_power_share_pct", "Power share when bought in", "%", 50, "Power still used when the bare board is bought. 50 halves the power cost."),
    ],
    ("factory", "Packaging"): [
        _s("esd_bag", "ESD bag", "INR", 2.5, "Anti static bag per board. 2.5 each."),
        _s("carton", "Carton", "INR", 1.5, "Carton share per assembled board. 1.5 each."),
        _s("shipping_per_board", "Shipping per board", "INR", 5, "Delivery cost per board. 5 each."),
        _s("bare_packaging_share_pct", "Packaging share for bare boards", "%", 50, "Part of bag and shipping a bare board uses. 50 turns 7.5 into 3.75."),
    ],
    ("factory", "Tooling"): [
        _s("tooling", "Tooling per order", "INR", 15000, "Stencils and fixtures for each in house order. 15000 over 500 boards adds 30 each."),
    ],
}


def default_settings() -> list[dict]:
    return [{**s, "page": page, "section": section} for (page, section), items in SECTIONS.items() for s in items]
