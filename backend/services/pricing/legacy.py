from backend.core import supabase
from backend.models.pricing import PricingConfig
from backend.services.pricing.defaults import default_config

# old pricing_rates key -> v2 setting key
OLD_KEYS = {
    "panelW": "panel_width", "panelL": "panel_length", "routingGap": "routing_gap", "edgeMargin": "edge_margin",
    "yieldPct": "yield_pct", "workDays": "work_days", "shifts": "shifts", "lamRate": "laminate_rate",
    "procRate": "process_rate", "bom": "parts_per_board", "solderPaste": "solder_paste", "consumables": "other_consumables",
    "compWastagePct": "parts_wastage_pct", "drillRouterWear": "drill_wear", "compFreightPct": "parts_freight_pct",
    "tooling": "tooling", "opsPerShift": "operators_per_shift", "opSalary": "operator_salary", "qcSalary": "qc_salary",
    "supervisorSalary": "supervisor_salary", "benefitsPct": "benefits_pct", "reworkPct": "rework_pct",
    "camTimeHrs": "cam_hours", "camHoursPerMonth": "cam_hours_per_month", "loadKw": "load_kw", "runHours": "run_hours",
    "utilPct": "utilisation_pct", "tariff": "power_tariff", "lighting": "lighting", "nitrogen": "nitrogen",
    "waterEffluent": "water_effluent", "rent": "rent", "admin": "admin_salaries", "marketing": "marketing",
    "software": "software", "maintenance": "maintenance", "insurance": "insurance", "interest": "interest",
    "misc": "misc", "depreciation": "depreciation", "esdBag": "esd_bag", "cartonPacking": "carton",
    "shipping": "shipping_per_board", "bankChargesPct": "bank_charges_pct", "warrantyPct": "warranty_pct",
    "compliance": "compliance_fee", "ohAllocPct": "order_share_pct", "bareConsumablesSharePct": "bare_consumables_share_pct",
    "barePackagingSharePct": "bare_packaging_share_pct", "outsourceLabourSharePct": "outsourced_labour_share_pct",
    "outsourceEnergySharePct": "outsourced_power_share_pct", "baseEngFee": "base_engineering_fee",
    "extraLayerFee": "extra_layer_fee", "gstPct": "gst_pct",
}


def starting_config() -> PricingConfig:
    """Built in defaults, with the admin's numbers carried over from the old tables when they exist."""
    cfg = default_config()
    try:
        old = {r["key"]: r["value"] for r in supabase.get_rows("pricing_rates", {"select": "key,value"})}
        policy = supabase.get_rows("pricing_policy", {"select": "fab_source", "limit": 1})
    except supabase.SupabaseError:
        return cfg
    values = {new: float(old[k]) for k, new in OLD_KEYS.items() if old.get(k) is not None}
    if policy and policy[0].get("fab_source") == "inhouse":
        values["inhouse"] = 1
    for s in cfg.settings:
        if s.key in values:
            lo, hi = s.min if s.min is not None else values[s.key], s.max if s.max is not None else values[s.key]
            s.value = min(max(values[s.key], lo), hi)
    return cfg
