"""
Media utilities for Google Drive URL handling and media type detection.
"""

import re
from typing import Optional

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

GDRIVE_PATTERNS = [
    re.compile(r"drive\.google\.com/file/d/([a-zA-Z0-9_-]+)"),
    re.compile(r"drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)"),
    re.compile(r"drive\.usercontent\.google\.com/download\?id=([a-zA-Z0-9_-]+)"),
    re.compile(r"drive\.google\.com/uc\?.*id=([a-zA-Z0-9_-]+)"),
]

IMAGE_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp",
}
VIDEO_CONTENT_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
    "video/mpeg", "video/x-matroska",
}
SUPPORTED_CONTENT_TYPES = IMAGE_CONTENT_TYPES | VIDEO_CONTENT_TYPES

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mpeg", ".mpg", ".mkv"}


def is_google_drive_url(url: str) -> bool:
    """Check if a URL is a Google Drive link."""
    return extract_gdrive_file_id(url) is not None


def extract_gdrive_file_id(url: str) -> Optional[str]:
    """Extract the file ID from a Google Drive URL. Returns None if not a Drive URL."""
    for pattern in GDRIVE_PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group(1)
    return None


def detect_media_type(content_type: Optional[str], filename: Optional[str]) -> str:
    """Detect whether media is PHOTO or VIDEO based on content-type or filename.

    Returns "PHOTO" or "VIDEO". Defaults to "PHOTO" if indeterminate.
    """
    if content_type:
        ct = content_type.split(";")[0].strip().lower()
        if ct in VIDEO_CONTENT_TYPES:
            return "VIDEO"
        if ct in IMAGE_CONTENT_TYPES:
            return "PHOTO"

    if filename:
        ext = _get_extension(filename)
        if ext in VIDEO_EXTENSIONS:
            return "VIDEO"
        if ext in IMAGE_EXTENSIONS:
            return "PHOTO"

    return "PHOTO"


def _get_extension(filename: str) -> str:
    """Extract lowercase file extension from a filename."""
    dot_idx = filename.rfind(".")
    if dot_idx == -1:
        return ""
    return filename[dot_idx:].lower()
