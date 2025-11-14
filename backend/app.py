import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

import os, json
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import orjson
from core.utils import load_json
from core.audit import audit_program
from core.planner import greedy_plan
from core.scheduler import pick_sections
from core.policy_agent import draft_override
from core.explainer_agent import explain_decision
from core.pdf_parser import pdf_to_transcript

app = FastAPI(title="Agentic Degree Advisor")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

CATALOG = load_json("catalog.json")
OFFERINGS = load_json("offerings.json")
DEFAULT_PROGRAM = list(CATALOG["programs"].keys())[0]

class AuditRequest(BaseModel):
    transcript: dict
    program_id: str = DEFAULT_PROGRAM
class PlanRequest(BaseModel):
    transcript: dict
    program_id: str = DEFAULT_PROGRAM
    term_sequence: list = [OFFERINGS.get("term","2026S"), "2026F", "2027S"]
class ScheduleRequest(BaseModel):
    planned_terms: list
class ExplainRequest(BaseModel):
    planned_terms: list
    requirements: list
    course: str
    term: str

@app.get("/health")
def health():
    return {"status":"ok"}

@app.post("/upload_transcript")
def upload_transcript(file: UploadFile = File(...)):
    raw = file.file.read()
    try:
        data = orjson.loads(raw)
    except Exception:
        data = json.loads(raw)
    return {"transcript": data}

@app.post("/upload_transcript_pdf")
def upload_transcript_pdf(file: UploadFile = File(...)):
    pdf_bytes = file.file.read()
    transcript = pdf_to_transcript(pdf_bytes)
    program_id = DEFAULT_PROGRAM
    program = CATALOG["programs"][program_id]
    audit_res = audit_program(transcript, program)
    _, planned = greedy_plan(transcript, program, [OFFERINGS.get("term","2026S"), "2026F"])
    return {"transcript": transcript, "audit": audit_res, "planned_terms": planned}

@app.post("/audit")
def audit(req: AuditRequest):
    program = CATALOG["programs"][req.program_id]
    results = audit_program(req.transcript, program)
    return {"program_id": req.program_id, "audit": results}

@app.post("/plan")
def plan(req: PlanRequest):
    program = CATALOG["programs"][req.program_id]
    audit_res, planned = greedy_plan(req.transcript, program, req.term_sequence)
    return {"audit": audit_res, "planned_terms": planned}

@app.post("/schedule")
def schedule(req: ScheduleRequest):
    next_term = req.planned_terms[0]["term"] if req.planned_terms else OFFERINGS["term"]
    courses = req.planned_terms[0]["courses"] if req.planned_terms else []
    chosen, needs = pick_sections(courses, OFFERINGS)
    return {"term": next_term, "chosen_sections": chosen, "needs_overrides": needs}

@app.post("/override_draft")
def override_draft_endpoint(payload: dict):
    student = payload.get("student", {"name":"Student","id":"Z0000000"})
    course = payload["course"]
    term = payload.get("term", OFFERINGS.get("term","2026S"))
    reason = payload.get("reason","Section is full")
    evidence = payload.get("evidence","On-track graduation requires this course")
    text = draft_override(student, course, term, reason, evidence)
    return {"draft": text}

@app.post("/explain")
def explain(req: ExplainRequest):
    text = explain_decision({"planned_terms": req.planned_terms}, req.requirements, req.course, req.term)
    return {"explanation": text}
