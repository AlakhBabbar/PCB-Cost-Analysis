from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from backend.core.ratelimit import limit
from backend.core.session import session_id
from backend.services.gerber.parser import parse_gerber_zip
from backend.services.gerber.zipcheck import check_zip
from backend.services.records import uploads

router = APIRouter(prefix="/api/gerber", tags=["gerber"])
MAX_BYTES = 50 * 1024 * 1024


async def read_zip(file: UploadFile) -> tuple[str, bytes]:
    """Validate an uploaded Gerber zip. Returns (filename, bytes)."""
    name = file.filename or "upload.zip"
    if not name.lower().endswith(".zip"):
        raise HTTPException(400, "Only .zip files are accepted")
    data = await file.read(MAX_BYTES + 1)
    if not data:
        raise HTTPException(400, "Uploaded file is empty")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File exceeds 50 MB")
    try:
        check_zip(data)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return name, data


@router.post("/parse", dependencies=[Depends(limit("parse", 10, 60))])
async def parse(file: UploadFile = File(...), sid: str | None = Depends(session_id)):
    name, data = await read_zip(file)
    result = await run_in_threadpool(parse_gerber_zip, data, name)
    upload_id = await run_in_threadpool(uploads.store, sid, name, data, result)
    if not upload_id:
        result.errors.append("We could not save your file. Please try again.")
    return {**result.model_dump(), "uploadId": upload_id, "ok": uploads.usable(result)}
