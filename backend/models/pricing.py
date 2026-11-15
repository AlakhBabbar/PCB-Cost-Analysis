from typing import Literal

from pydantic import BaseModel, Field


class Setting(BaseModel):
    key: str
    label: str
    page: Literal["limits", "price", "factory"]
    section: str
    unit: str = ""
    kind: Literal["number", "switch"] = "number"
    value: float
    min: float | None = 0
    max: float | None = None
    help: str = ""


class Option(BaseModel):
    name: str = Field(min_length=1)
    label: str = ""
    op: Literal["x", "pct", "add"]
    value: float
    orderFee: float = 0
    note: str = ""
    enabled: bool = True


class Category(BaseModel):
    key: str
    label: str
    target: str
    multi: bool = False
    help: str = ""
    options: list[Option]


class OrderType(BaseModel):
    name: str = Field(min_length=1)
    makesBoard: bool
    assembles: bool
    enabled: bool = True


class MarkupTier(BaseModel):
    maxQty: int = Field(ge=1)
    markupPct: float


class Formula(BaseModel):
    key: str
    label: str
    section: str = ""
    expr: str
    help: str = ""
    locked: bool = False


class Rule(BaseModel):
    id: str
    message: str = Field(min_length=1)
    when: str
    action: Literal["block", "manual"]
    enabled: bool = True


class PricingConfig(BaseModel):
    settings: list[Setting]
    categories: list[Category]
    orderTypes: list[OrderType]
    markupTiers: list[MarkupTier]
    formulas: list[Formula]
    rules: list[Rule]


class QuoteRequest(BaseModel):
    boardW: float = Field(gt=0)
    boardL: float = Field(gt=0)
    quantity: int = Field(ge=1)
    layers: str
    orderType: str
    thickness: str
    copper: str
    material: str
    maskColor: str
    silkscreen: str
    finish: str
    traceSpace: str
    minHole: str
    ipcStd: str
    testing: str
    express: str
    specials: dict[str, bool] = {}


class AdminQuoteRequest(QuoteRequest):
    config: dict | None = None


class ConfigBody(BaseModel):
    config: dict
    note: str = ""


class Adjustment(BaseModel):
    category: str
    option: str
    op: str
    value: float
    delta: float


class Line(BaseModel):
    key: str
    label: str
    section: str
    value: float
    adjustments: list[Adjustment] = []


class Profit(BaseModel):
    perBoard: float
    total: float
    marginPct: float


class QuoteResponse(BaseModel):
    pricePerBoard: float
    quantity: int
    engFee: float
    subtotal: float
    gstPct: float
    gst: float
    total: float
    delivery: str
    summary: dict[str, str]
    manual: bool = False
    manualReason: str | None = None


class AdminQuoteResponse(QuoteResponse):
    costPerBoard: float
    profit: Profit
    lines: list[Line]
