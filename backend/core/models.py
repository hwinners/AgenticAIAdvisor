from typing import List, Dict, Optional
from pydantic import BaseModel

class CourseTaken(BaseModel):
    code: str
    term: str
    grade: str
    credits: Optional[int] = None

class Transcript(BaseModel):
    student: Dict[str, str]
    taken: List[CourseTaken]
    transfer_credits: int = 0

class RequirementStatus(BaseModel):
    id: str
    type: str
    met: bool
    details: Dict

class PlannedTerm(BaseModel):
    term: str
    courses: List[str]
    credits: int

class ChosenSection(BaseModel):
    course: str
    crn: str
    days: str
    start: str
    end: str
    cap: int
    enrolled: int
    note: Optional[str] = None

class PlanResponse(BaseModel):
    audit: List[RequirementStatus]
    planned_terms: List[PlannedTerm]
    chosen_sections: List[ChosenSection]
    needs_overrides: List[ChosenSection]
