from pathlib import Path

from .llm import client, MODEL

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "override_prompt.txt"
BASE_PROMPT = PROMPT_PATH.read_text(encoding="utf-8") if PROMPT_PATH.exists() else "System: Draft a concise, professional override/waiver email (120-180 words)."
def draft_override(student, course, term, reason, evidence, dept_contact="Advisor Team"):
    user = f"Student {student.get('name','Student')} (ID {student.get('id','Z00000000')}) needs an override for {course} in term {term}. Reason: {reason}. Evidence: {evidence}. Address to: {dept_contact}."
    resp = client.chat.completions.create(model=MODEL, messages=[{"role":"system","content":BASE_PROMPT},{"role":"user","content":user}])
    return resp.choices[0].message.content.strip()
