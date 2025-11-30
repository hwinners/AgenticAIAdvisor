import io, re
from typing import List, Dict
import pdfplumber
from pdf2image import convert_from_bytes
import pytesseract
COURSE_ROW_REGEX = re.compile(
    r"[\"']?(?P<term>\d{4})[\"']?"           # Term: 4 digits (e.g. 2205), optional quotes
    r".*?"                                   # Junk chars (commas, whitespace)
    r"[\"']?(?P<code>[A-Z]{3}\s?\d{4})[\"']?" # Code: 3 letters + 4 digits (e.g. COP2220)
    r".*?"                                   # Junk chars
    r"[\"']?(?P<credits>\d+\.\d{2})[\"']?"   # Credits: e.g. 3.00
    r".*?"                                   # Junk chars
    r"[\"']?(?P<grade>[A-Z][\+\-]?)[\"']?"   # Grade: A, B+, etc.
)
ID_REGEX       = re.compile(r"\b(Z\d{7,9})\b")
NAME_REGEX     = re.compile(r"Name[:\s]+([A-Z][A-Za-z\-']+(?:\s[A-Z][A-Za-z\-']+)*)")
TRANSFER_REGEX = re.compile(r"Transfer\s+Credits[:\s]+(\d+)", re.IGNORECASE)
def _has_text(pdf_bytes: bytes) -> bool:
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for p in pdf.pages[:3]:
                if (p.extract_text() or "").strip():
                    return True
    except Exception:
        pass
    return False
def _extract_text(pdf_bytes: bytes) -> str:
    out = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for p in pdf.pages:
            t = p.extract_text() or ""; out.append(t)
            try:
                for tbl in (p.extract_tables() or []):
                    for row in tbl:
                        out.append(" | ".join([(c or "").strip() for c in row]))
            except Exception:
                pass
    return "\n".join(out)
def _extract_ocr(pdf_bytes: bytes, dpi=200) -> str:
    images = convert_from_bytes(pdf_bytes, dpi=dpi)
    return "\n".join(pytesseract.image_to_string(img.convert("L")) for img in images)
def _parse_courses(text: str) -> List[Dict]:
    recs: List[Dict] = []
    for m in COURSE_ROW_REGEX.finditer(text):
        recs.append({"code": m.group("code").replace(" ", ""), "term": m.group("term"), "grade": m.group("grade"), "credits": float(m.group("credits"))})
    seen, uniq = set(), []
    for r in recs:
        k = (r["code"], r["term"], r["grade"])
        if k not in seen:
            seen.add(k); uniq.append(r)
    return uniq
def pdf_to_transcript(pdf_bytes: bytes) -> Dict:
    text = _extract_text(pdf_bytes) if _has_text(pdf_bytes) else _extract_ocr(pdf_bytes)
    courses = _parse_courses(text)
    student = {"id": (ID_REGEX.search(text).group(1) if ID_REGEX.search(text) else None),"name": (NAME_REGEX.search(text).group(1) if NAME_REGEX.search(text) else None),"program": None}
    transfer = int(TRANSFER_REGEX.search(text).group(1)) if TRANSFER_REGEX.search(text) else 0
    return {"student": student, "taken": courses, "transfer_credits": transfer}
