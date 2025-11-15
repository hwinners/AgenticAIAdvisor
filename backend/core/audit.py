from typing import Dict, List, Set
def build_completed_set(transcript) -> Set[str]:
    return {t["code"] for t in transcript["taken"]}
def audit_program(transcript: Dict, program: Dict):
    completed = build_completed_set(transcript)
    reqs = program["requirements"]
    results = []
    for r in reqs:
        if r["type"] == "all_of":
            missing = [c for c in r["courses"] if c not in completed]
            results.append({
                "id": r.get("id", "+".join(r.get("courses", []))),
                "type": "all_of",
                "met": len(missing) == 0,
                "details": {"missing": missing, "courses": r["courses"]}
            })
        elif r["type"] == "choose_n":
            done = [c for c in r["from"] if c in completed]
            need = max(0, r["n"] - len(done))
            results.append({
                "id": r.get("id", "choose_n"),
                "type": "choose_n",
                "met": need == 0,
                "details": {"need": need, "done": done, "pool": r["from"]}
            })
        elif r["type"] == "credits_at_least":
            earned = 0
            for t in transcript["taken"]:
                code = t["code"]
                if program["course_meta"].get(code, {}).get("area") == r["area"]:
                    earned += program["course_meta"][code]["credits"]
            need = max(0, r["credits"] - earned)
            results.append({
                "id": r.get("id", f"credits_{r['area']}"),
                "type": "credits_at_least",
                "met": need == 0,
                "details": {"earned": earned, "need": need, "area": r["area"]}
            })
    return results


# Theoretical code that would work, but doesnt
# from typing import Dict, List, Set

# def build_completed_set(transcript) -> Set[str]:
#     return {t["code"] for t in transcript["taken"]}

# def audit_program(transcript: Dict, program: Dict):
#     completed = build_completed_set(transcript)
#     reqs = program["requirements"]
#     results = []

#     for r in reqs:
#         if r["type"] == "all_of":
#             # Completed courses in this requirement
#             done = [c for c in r["courses"] if c in completed]
#             # Courses still missing
#             missing = [c for c in r["courses"] if c not in completed]

#             results.append({
#                 "id": r.get("id", "+".join(r.get("courses", []))),
#                 "type": "all_of",
#                 "met": len(missing) == 0,
#                 "details": {
#                     "completed": done,
#                     "missing": missing,
#                     "all_courses": r["courses"]
#                 }
#             })

#         elif r["type"] == "choose_n":
#             done = [c for c in r["from"] if c in completed]
#             missing_count = max(0, r["n"] - len(done))
#             results.append({
#                 "id": r.get("id", "choose_n"),
#                 "type": "choose_n",
#                 "met": missing_count == 0,
#                 "details": {
#                     "completed": done,
#                     "missing": r["n"] - len(done),
#                     "pool": r["from"],
#                     "n": r["n"]
#                 }
#             })

#         elif r["type"] == "credits_at_least":
#             earned = 0
#             for t in transcript["taken"]:
#                 code = t["code"]
#                 if program["course_meta"].get(code, {}).get("area") == r["area"]:
#                     earned += program["course_meta"][code]["credits"]

#             need = max(0, r["credits"] - earned)

#             results.append({
#                 "id": r.get("id", f"credits_{r['area']}"),
#                 "type": "credits_at_least",
#                 "met": need == 0,
#                 "details": {
#                     "earned": earned,
#                     "need": need,
#                     "area": r["area"]
#                 }
#             })

#     return results
