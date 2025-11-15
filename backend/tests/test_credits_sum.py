from core.utils import load_json


def test_term_credits_sum():
    # Load catalog and pick the default program
    cat = load_json("catalog.json")
    program = cat["programs"][list(cat["programs"].keys())[0]]
    meta = program["course_meta"]

    # Sample planned term with three 3-credit courses
    planned = {"term": "2026S", "courses": ["COP3014", "COP3530", "CDA3103"], "credits": 9}

    expected = sum(meta[c]["credits"] for c in planned["courses"])
    assert expected == planned["credits"], f"Term credits mismatch: expected {expected}, got {planned['credits']}"
