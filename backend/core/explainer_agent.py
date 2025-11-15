import json
from .llm import client, MODEL
from .utils import load_json

EXPLAIN_SYSTEM = "You explain degree planning decisions clearly and briefly and short only do three semesters ahead."


def explain_decision(plan_json: dict, req_json: dict, course: str, term: str):
    # Build a small credits map for any courses mentioned in the plan so the LLM
    # gets exact per-course credit values instead of guessing.
    catalog = load_json("catalog.json")
    credits_map = {}
    for pid, prog in catalog.get("programs", {}).items():
        for code, meta in prog.get("course_meta", {}).items():
            credits_map[code.upper().strip()] = meta.get("credits")

    # Build a human-readable credits block for the prompt
    involved = set()
    for t in plan_json.get("planned_terms", []):
        for c in t.get("courses", []):
            involved.add(c.upper().strip())

    credits_lines = []
    for c in sorted(involved):
        cr = credits_map.get(c)
        credits_lines.append(f"{c}: {cr if cr is not None else 'unknown'}")

    user = (
        "Given this plan JSON: ```"
        + json.dumps(plan_json)
        + "``` and requirements: ```"
        + json.dumps(req_json)
        + f"```, answer: Why was {course} placed in {term}? Include prereq chain and credit balance.\n\n"
        + "Course credits (from catalog):\n```"
        + "\n".join(credits_lines)
        + "\n```"
    )

    resp = client.chat.completions.create(
        model=MODEL, messages=[{"role": "system", "content": EXPLAIN_SYSTEM}, {"role": "user", "content": user}]
    )
    return resp.choices[0].message.content.strip()
