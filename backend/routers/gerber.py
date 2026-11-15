import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, field_validator

from backend.core.ratelimit import limit
from backend.core.session import session_id
from backend.core.settings import settings
from backend.services.gerber.parser import parse_gerber_zip
from backend.services.gerber.zipcheck import check_zip
from backend.services.records import uploads

router = APIRouter(prefix="/api/gerber", tags=["gerber"])
MAX_BYTES = settings.max_upload_mb * 1024 * 1024
TOO_BIG = f"This file is larger than {settings.max_upload_mb} MB."


class UploadAsk(BaseModel):
    filename: str = Field(min_length=1, max_length=200)
    size: int = Field(gt=0)


class ParseAsk(BaseModel):
    uploadId: str
    filename: str = Field(min_length=1, max_length=200)

    @field_validator("uploadId")
    @classmethod
    def _id(cls, v: str) -> str:
        return str(uuid.UUID(v))


def check_name(name: str) -> None:
    if not name.lower().endswith(".zip"):
        raise HTTPException(400, "Only .zip files are accepted")


def check_bytes(data: bytes) -> None:
    if not data:
        raise HTTPException(400, "Uploaded file is empty")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, TOO_BIG)
    try:
        check_zip(data)
    except ValueError as exc:
        raise HTTPException(400, str(exc))


async def read_zip(file: UploadFile) -> tuple[str, bytes]:
    """Validate an uploaded Gerber zip. Returns (filename, bytes)."""
    name = file.filename or "upload.zip"
    check_name(name)
    data = await file.read(MAX_BYTES + 1)
    check_bytes(data)
    return name, data


def _answer(result, upload_id: str | None) -> dict:
    if not upload_id:
        result.errors.append("We could not save your file. Please try again.")
    return {**result.model_dump(), "uploadId": upload_id, "ok": uploads.usable(result)}


@router.post("/parse", dependencies=[Depends(limit("parse", 10, 60))])
async def parse(file: UploadFile = File(...), sid: str | None = Depends(session_id)):
    """The zip comes through the API. Used where direct upload is off."""
    name, data = await read_zip(file)
    result = await run_in_threadpool(parse_gerber_zip, data, name)
    return _answer(result, await run_in_threadpool(uploads.store, sid, name, data, result))


@router.post("/upload-url", dependencies=[Depends(limit("upload", 10, 60))])
def upload_url(body: UploadAsk):
    """Step 1 of direct upload: a one time link the browser sends the zip to, so big files skip the API."""
    if not settings.direct_upload:
        raise HTTPException(404, "Direct upload is off")
    check_name(body.filename)
    if body.size > MAX_BYTES:
        raise HTTPException(413, TOO_BIG)
    link = uploads.upload_link()
    if not link:
        raise HTTPException(503, "We could not start the upload. Please try again.")
    return link


@router.post("/parse-upload", dependencies=[Depends(limit("parse", 10, 60))])
async def parse_upload(body: ParseAsk, sid: str | None = Depends(session_id)):
    """Step 2 of direct upload: read the zip from storage, check it, parse it."""
    check_name(body.filename)
    data = await run_in_threadpool(uploads.fetch, body.uploadId)
    if data is None:
        raise HTTPException(404, "We could not find that upload. Please upload the file again.")
    try:
        check_bytes(data)
    except HTTPException:
        await run_in_threadpool(uploads.discard, body.uploadId)
        raise
    result = await run_in_threadpool(parse_gerber_zip, data, body.filename)
    await run_in_threadpool(uploads.record, sid, body.uploadId, body.filename, len(data), result)
    return _answer(result, body.uploadId)
