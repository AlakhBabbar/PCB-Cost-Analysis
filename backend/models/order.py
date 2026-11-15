import re
import uuid

from pydantic import BaseModel, Field, field_validator

from backend.models.pricing import QuoteRequest

GSTIN = re.compile(r"\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]")


def clean_email(v: str) -> str:
    v = v.strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v):
        raise ValueError("invalid email")
    return v


def clean_phone(v: str) -> str:
    digits = re.sub(r"\D", "", v)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) != 10:
        raise ValueError("enter a 10-digit mobile number")
    return digits


class Customer(BaseModel):
    firstName: str = Field(min_length=1, max_length=60)
    lastName: str = Field(min_length=1, max_length=60)
    email: str = Field(max_length=120)
    phone: str = Field(max_length=20)
    company: str = Field(default="", max_length=120)
    gstin: str = Field(default="", max_length=20)
    address1: str = Field(min_length=3, max_length=200)
    address2: str = Field(default="", max_length=200)
    city: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=4)  # WooCommerce state code, e.g. "UP"
    postcode: str
    note: str = Field(default="", max_length=1000)

    @field_validator("firstName", "lastName", "company", "address1", "address2", "city", "note")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()

    _email = field_validator("email")(lambda cls, v: clean_email(v))
    _phone = field_validator("phone")(lambda cls, v: clean_phone(v))

    @field_validator("gstin")
    @classmethod
    def _gstin(cls, v: str) -> str:
        v = v.strip().upper()
        if v and not GSTIN.fullmatch(v):
            raise ValueError("enter a valid 15 character GSTIN")
        return v

    @field_validator("postcode")
    @classmethod
    def _postcode(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"\d{6}", v):
            raise ValueError("enter a 6-digit PIN code")
        return v

    @field_validator("state")
    @classmethod
    def _state(cls, v: str) -> str:
        return v.strip().upper()


class OrderRequest(BaseModel):
    uploadId: str
    quote: QuoteRequest
    customer: Customer

    @field_validator("uploadId")
    @classmethod
    def _upload(cls, v: str) -> str:
        return str(uuid.UUID(v))


class OrderResponse(BaseModel):
    orderId: int
    paymentUrl: str
