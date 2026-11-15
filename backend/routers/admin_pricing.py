from fastapi import APIRouter, Depends, HTTPException

from backend.core.auth import require_manager
from backend.models.pricing import AdminQuoteRequest, AdminQuoteResponse, ConfigBody, PricingConfig, QuoteRequest, TryBody
from backend.services.pricing import store
from backend.services.pricing.defaults import default_config
from backend.services.pricing.expr import ExprError, evaluate, parse
from backend.services.pricing.quote import calculate_quote
from backend.services.pricing.validate import check
from backend.services.records import activity

router = APIRouter(prefix="/api/admin", tags=["admin-pricing"], dependencies=[Depends(require_manager)])


def _state(cfg: PricingConfig, updated_at, ready) -> dict:
    return {"config": cfg.model_dump(mode="json"), "updatedAt": updated_at, "ready": ready}


def _valid(data: dict) -> PricingConfig:
    cfg, errors = check(data)
    if errors:
        raise HTTPException(422, errors)
    return cfg


def _save(cfg: PricingConfig, me: dict, note: str) -> dict:
    try:
        out = _state(*store.save_config(cfg, me, note))
    except store.ConfigUnavailable as exc:
        raise HTTPException(503, str(exc))
    activity.log("pricing_saved", "pricing", detail={"note": note}, admin=me)
    return out


@router.get("/pricing")
def get_pricing():
    return _state(*store.load_config())


@router.put("/pricing")
def put_pricing(body: ConfigBody, me: dict = Depends(require_manager)):
    return _save(_valid(body.config), me, body.note)


@router.get("/pricing/defaults")
def get_defaults():
    return {"config": default_config().model_dump(mode="json")}


@router.post("/pricing/check")
def check_pricing(body: ConfigBody):
    errors = check(body.config)[1]
    return {"ok": not errors, "errors": errors}


@router.post("/pricing/try")
def try_formula(body: TryBody):
    """Run one formula on test numbers with the same evaluator real prices use. Nothing is saved."""
    on = {tuple(p) for p in body.picked}
    try:
        value = evaluate(parse(body.expr), body.values, lambda c, o: (c, o) in on, lambda c: body.chosen.get(c, 0.0))
    except ExprError as exc:
        return {"ok": False, "error": str(exc)}
    return {"ok": True, "value": round(value, 6)}


@router.get("/pricing/versions")
def versions():
    return {"items": store.list_versions()}


@router.post("/pricing/versions/{version_id}/restore")
def restore(version_id: int, me: dict = Depends(require_manager)):
    try:
        snapshot = store.get_version(version_id)
    except store.ConfigUnavailable as exc:
        raise HTTPException(503, str(exc))
    if snapshot is None:
        raise HTTPException(404, "That version was not found")
    return _save(_valid(snapshot), me, f"Restored version {version_id}")


@router.post("/quote", response_model=AdminQuoteResponse)
def admin_quote(req: AdminQuoteRequest):
    cfg = _valid(req.config) if req.config is not None else store.get_config()
    try:
        return calculate_quote(QuoteRequest(**req.model_dump(include=set(QuoteRequest.model_fields))), cfg)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
