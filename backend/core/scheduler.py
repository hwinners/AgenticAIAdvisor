from typing import List, Dict
def conflict(a, b):
    if a["days"] != b["days"]:
        return False
    return not (a["end"] <= b["start"] or b["end"] <= a["start"])
def pick_sections(planned_courses: List[str], offerings: Dict):
    chosen = []
    for c in planned_courses:
        secs = offerings["sections"].get(c, [])
        picked = None
        for s in secs:
            if s["enrolled"] < s["cap"] and all(not conflict(s, x) for x in chosen):
                picked = {"course": c, **s}; break
        if not picked and secs:
            picked = {"course": c, **secs[0], "note": "full/overlap → needs override"}
        if picked:
            chosen.append(picked)
    needs = [x for x in chosen if x.get("note")]
    return chosen, needs
