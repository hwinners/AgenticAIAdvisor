from typing import Dict, List, Set
from .audit import audit_program
def collect_missing_courses(audit_results) -> Set[str]:
    missing = set()
    for r in audit_results:
        if r["type"] == "all_of":
            missing |= set(r["details"]["missing"])
        elif r["type"] == "choose_n" and not r["met"]:
            pool = r["details"]["pool"]
            done = set(r["details"].get("done", []))
            need = r["details"]["need"]
            picks = [c for c in pool if c not in done][:need]
            missing |= set(picks)
    return missing
def eligible(course: str, prereqs: Dict[str, List[str]], satisfied: Set[str]) -> bool:
    return all(p in satisfied for p in prereqs.get(course, []))
def greedy_plan(transcript, program, term_sequence: List[str]):
    prereqs = program.get("prereqs", {})
    meta = program["course_meta"]
    satisfied = {t["code"] for t in transcript["taken"]}
    audit = audit_program(transcript, program)
    remaining = list(collect_missing_courses(audit))
    planned_terms = []
    already_planned = set()
    for term in term_sequence:
        bucket, credits = [], 0
        for c in sorted(list(remaining)):
            if c in already_planned:
                continue
            cr = meta[c]["credits"]
            if eligible(c, prereqs, satisfied) and credits + cr <= 15:
                bucket.append(c); credits += cr; satisfied.add(c); already_planned.add(c)
        remaining = [c for c in remaining if c not in bucket]
        if bucket:
            planned_terms.append({"term": term, "courses": bucket, "credits": credits})
        if not remaining:
            break
    return audit, planned_terms
