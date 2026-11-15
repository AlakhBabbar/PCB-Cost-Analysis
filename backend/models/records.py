from typing import Literal

from pydantic import BaseModel, Field, field_validator

from backend.models.order import clean_email, clean_phone
from backend.models.pricing import QuoteRequest

Role = Literal["owner", "manager", "staff"]
Stage = Literal["new", "file_review", "in_production", "quality_check", "shipped", "delivered", "cancelled"]


class Contact(BaseModel):
    firstName: str | None = Field(default=None, max_length=60)
    lastName: str | None = Field(default=None, max_length=60)
    email: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    company: str | None = Field(default=None, max_length=120)

    _email = field_validator("email")(lambda cls, v: clean_email(v) if v else None)
    _phone = field_validator("phone")(lambda cls, v: clean_phone(v) if v else None)


class CheckoutRequest(BaseModel):
    kind: Literal["checkout", "manual"]
    contact: Contact = Contact()
    note: str | None = Field(default=None, max_length=1000)
    quote: QuoteRequest | None = None


class OrderPatch(BaseModel):
    stage: Stage | None = None
    adminNote: str | None = Field(default=None, max_length=2000)


class SessionPatch(BaseModel):
    handled: bool | None = None
    adminNote: str | None = Field(default=None, max_length=2000)


class RoleBody(BaseModel):
    role: Role
