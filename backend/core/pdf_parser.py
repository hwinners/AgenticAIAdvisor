import io, re
from typing import List, Dict
import pdfplumber
from pdf2image import convert_from_bytes
import pytesseract

# --- UPDATED REGEX ---
# 1. Matches "2205" (Term) first
# 2. Matches "EGN 4950 C" or "COP2220"
# 3. CRITICAL FIX: Uses [ \t]* instead of \s* for the suffix to prevent 
#    matching newlines (which was eating the next course's first letter).
COURSE_ROW_REGEX = re.compile(
    r"[\"']?(?P<term>\d{4})[\"']?"              # Term: Matches "2205"
    r".*?"                                      # Junk chars
    r"[\"']?(?P<code>[A-Z]{3,4}[ \t]*\d{3,4}(?:[ \t]*[A-Za-z])?)[\"']?" # Code: Matches "EGN 4950 C" but NOT "EGN 4950 \n E"
    r".*?"                                      # Junk chars
    r"[\"']?(?P<credits>\d+\.\d{1,2})[\"']?"    # Credits: Matches "3.00"
    r".*?"                                      # Junk chars
    r"[\"']?(?P<grade>(?:[A-Z]{1,2}[\+\-]?))[\"']?" # Grade: Matches "A", "IP", "B+"
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

def _explode_row(row: List[str]) -> List[List[str]]:
    """
    Takes a table row where cells might contain newlines (multiple courses stacked)
    and splits them into multiple single-line rows.
    Example: ['2205\n2205', 'COP2220\nMAC2311'] -> [['2205', 'COP2220'], ['2205', 'MAC2311']]
    """
    # Split every cell by newline
    lines_by_cell = [str(c).split('\n') if c else [] for c in row]
    # Find the maximum number of lines in this row
    max_lines = max((len(l) for l in lines_by_cell), default=0)
    
    new_rows = []
    for i in range(max_lines):
        new_row = []
        for lines in lines_by_cell:
            if i < len(lines):
                # Take the i-th line of this cell
                new_row.append(lines[i].strip())
            else:
                # If this cell is shorter than others, pad with empty string
                new_row.append("") 
        new_rows.append(new_row)
    return new_rows

def _extract_text(pdf_bytes: bytes) -> str:
    out = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for p in pdf.pages:
            # 1. Extract raw text for ID/Name search
            t = p.extract_text() or ""
            out.append(t)
            try:
                # 2. Extract tables to catch the course data
                for tbl in (p.extract_tables() or []):
                    for row in tbl:
                        # Explode multiline rows into separate single lines
                        sub_rows = _explode_row(row)
                        for sub_row in sub_rows:
                            # Reconstruct CSV-style row
                            cleaned_row = [f'"{c}"' if c else "" for c in sub_row]
                            out.append(",".join(cleaned_row))
            except Exception:
                pass
    return "\n".join(out)

def _extract_ocr(pdf_bytes: bytes, dpi=200) -> str:
    images = convert_from_bytes(pdf_bytes, dpi=dpi)
    return "\n".join(pytesseract.image_to_string(img.convert("L")) for img in images)

def _parse_courses(text: str) -> List[Dict]:
    recs: List[Dict] = []
    for m in COURSE_ROW_REGEX.finditer(text):
        # Normalize: "EGN 4950 C" -> "EGN4950C"
        raw_code = m.group("code")
        clean_code = raw_code.replace(" ", "")
        
        recs.append({
            "code": clean_code, 
            "term": m.group("term"), 
            "grade": m.group("grade"), 
            "credits": float(m.group("credits"))
        })
    
    seen, uniq = set(), []
    for r in recs:
        k = (r["code"], r["term"], r["grade"])
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    return uniq

def pdf_to_transcript(pdf_bytes: bytes) -> Dict:
    text = _extract_text(pdf_bytes) if _has_text(pdf_bytes) else _extract_ocr(pdf_bytes)
    
    # DEBUG: View the first 500 characters to verify rows are split correctly
    # print("DEBUG TEXT:", text[:500])
    
    courses = _parse_courses(text)
    
    student_id = ID_REGEX.search(text).group(1) if ID_REGEX.search(text) else None
    name_match = NAME_REGEX.search(text)
    student_name = name_match.group(1) if name_match else None
    transfer = int(TRANSFER_REGEX.search(text).group(1)) if TRANSFER_REGEX.search(text) else 0
    
    return {
        "student": {
            "id": student_id,
            "name": student_name,
            "program": None 
        }, 
        "taken": courses, 
        "transfer_credits": transfer
    }


def extract_text_and_courses(pdf_bytes: bytes, dpi=200) -> Dict:
    """Dev helper: return the extracted raw text and the parsed course rows.

    Use this via a debug endpoint to inspect what the parser sees from a PDF.
    """
    text = _extract_text(pdf_bytes) if _has_text(pdf_bytes) else _extract_ocr(pdf_bytes, dpi=dpi)
    courses = _parse_courses(text)
    return {"text": text, "courses": courses}