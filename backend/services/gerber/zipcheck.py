import io
import re
import zipfile

MAX_ENTRIES = 500
MAX_UNPACKED = 250 * 1024 * 1024


def check_zip(data: bytes) -> None:
    """Refuse zips that are broken, huge when unpacked, or carry unsafe paths. Raises ValueError."""
    try:
        infos = zipfile.ZipFile(io.BytesIO(data)).infolist()
    except zipfile.BadZipFile:
        raise ValueError("This file is not a valid zip.")
    if len(infos) > MAX_ENTRIES:
        raise ValueError(f"The zip holds more than {MAX_ENTRIES} files.")
    if sum(i.file_size for i in infos) > MAX_UNPACKED:
        raise ValueError("The zip unpacks to more than 250 MB.")
    for i in infos:
        name = i.filename.replace("\\", "/")
        if name.startswith("/") or re.match(r"[A-Za-z]:", name) or ".." in name.split("/"):
            raise ValueError("The zip contains unsafe file paths.")
