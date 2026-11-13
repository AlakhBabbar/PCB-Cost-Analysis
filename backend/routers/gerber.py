from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from backend.services.gerber.parser import parse_gerber_zip

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
    return name, data


@router.post("/parse")
async def parse(file: UploadFile = File(...)):
    name, data = await read_zip(file)
    result = await run_in_threadpool(parse_gerber_zip, data, name)
    return result.model_dump()
