import json
from typing import List, Dict, Any, Optional

from .audit import audit_program
from .planner import greedy_plan
from .llm import client, MODEL

SYSTEM_PROMPT = """
You are an academic advising assistant for engineering students.

You:
- Read the student's transcript, degree audit, and planned pathway.
- If the user asks which classes are confirmed for a specific term, answer only with the confirmed courses for that term, and do not auto-generate a full multi-semester plan unless asked by the student.
- Identify missing requirements and important prerequisites.
- Suggest multi-semester course pathways that keep the student on track to graduate.
- Take into account student goals and preferences (e.g., max credits per term, difficulty balance).
- Explain your recommendations clearly and briefly in friendly language.
- Keep in mind that every class is worth 3 credits.
- Keep in mind the student's missing classes are the only ones needed for them to complete their degree and graduate.
- Keep in mind that EGN4950C and EGN4952C are not that heavy loaded classes, so they can be taken together with other classes in a term.

Rules:
- Do NOT invent courses that are not in the catalog JSON.
- DO NOT suggest more classes than needed to graduate. 
- Respect prerequisites in the plan JSON (do not schedule a course before its prereqs).
- If you are unsure, say what assumptions you're making.
- 3 classes are equal to 9 credits per term, 4 classes are equal to 12 credits per term, 5 claases are equal to 15 credits per term, 6 classes are equal to 18 credits per term.
- If the student has less classes than what is needed to give them a plan for the next 3 terms, give a plan for the least amount of terms needed to meet the requirements and graduate.
- If a class is marked as 'IP' (In Progress) in the transcript, assume it will be completed successfully and can be used to satisfy requirements and prerequisites in the plan. Do not recommend the student to take classes marked as IP, suppose it is marked as taken.
- If EGN4950C has already been taken or is in progress, always suggest to the student in the plan and proposed schedule EGN4952C for Term 1 since it is required for the student to take it as soon as possible. 
- Because EGN4952C has to be taken if EGN4950C has been taken or is in progress, if EGN4952C is in the list of missing classes, always suggest it for Term 1 in the plan and proposed schedule. You cannot suggest the student to skip a term and take it later, it must be taken in the closest term possible.
"""

def build_context_blocks(
    transcript: Dict[str, Any],
    program: Dict[str, Any],
    audit: List[Dict[str, Any]],
    planned_terms: List[Dict[str, Any]],
) -> str:
    """Pack core engine outputs into a short text block for the LLM."""
    return (
        "CATALOG_PROGRAM_JSON:\n```"
        + json.dumps(
            {
                "total_credits": program["total_credits"],
                "requirements": program["requirements"],
                "prereqs": program.get("prereqs", {}),
            },
            indent=2,
        )
        + "```\n\n"
        "TRANSCRIPT_JSON:\n```"
        + json.dumps(transcript, indent=2)
        + "```\n\n"
        "AUDIT_RESULTS_JSON:\n```"
        + json.dumps(audit, indent=2)
        + "```\n\n"
        "PLANNED_TERMS_JSON:\n```"
        + json.dumps(planned_terms, indent=2)
        + "```"
    )

def chat_with_student(
    transcript: Dict[str, Any],
    program: Dict[str, Any],
    goals: str,
    preferences: Dict[str, Any],
    history: List[Dict[str, str]],
    term_sequence: list,
    existing_plan: Optional[List[Dict[str, Any]]] = None # <--- 1. ADD THIS ARGUMENT
) -> Dict[str, Any]:
    """
    High-level agent:
    - Runs the course/degree engine (audit + planner)
    - Calls the LLM to have a conversation and explain recommendations
    """

    # Run core engine
    audit = audit_program(transcript, program)
    
    # 2. USE EXISTING PLAN IF PROVIDED, OTHERWISE GENERATE NEW
    if existing_plan:
        planned_terms = existing_plan
    else:
        _, planned_terms = greedy_plan(transcript, program, term_sequence)

    # SINGLE backend shortcut: If the latest user message asks about confirmed classes for a term,
    # return only the confirmed courses for that term (avoid running the LLM).
    if history:
        last_user = next((msg for msg in reversed(history) if msg.get("role") == "user"), None)
        if last_user and last_user.get("content"):
            import re
            # matches something like "confirmed courses for 2026A" or "confirm courses 2026A"
            m = re.search(r"confirm(?:ed)? (?:class|classes|courses).*?(\d{4}[A-Za-z])", last_user["content"], re.IGNORECASE)
            if m:
                term_query = m.group(1)
                confirmed_for_term = []
                for term in planned_terms:
                    if term.get("term") == term_query:
                        confirmed_for_term = term.get("courses", [])
                        break
                if confirmed_for_term:
                    return {
                        "reply": f"You have confirmed the following courses for {term_query}: {', '.join(confirmed_for_term)}.",
                        "audit": audit,
                        "planned_terms": planned_terms,
                    }
                else:
                    return {
                        "reply": f"You have not confirmed any courses for {term_query}.",
                        "audit": audit,
                        "planned_terms": planned_terms,
                    }

    # --- Proceed to build LLM context and normal conversation flow ---
    # 3) Build context for the LLM
    credit_summary = "Planned Credits Per Term:\n"
    total_credits = 0
    for term in planned_terms:
        credit_summary += f"- {term['term']}: {term.get('credits', 0)} credits ({', '.join(term.get('courses', []))})\n"
        total_credits += term.get('credits', 0)
    credit_summary += f"Total Planned Credits: {total_credits}\n"

    confirmed_courses_block = ""
    if planned_terms and planned_terms[0].get('courses'):
        confirmed_courses_block = (
            "CONFIRMED_COURSES_FOR_NEXT_TERM:\n" +
            "\n".join(f"- {c}" for c in planned_terms[0].get('courses', [])) +
            "\n"
        )

    context = credit_summary + "\n" + confirmed_courses_block + build_context_blocks(transcript, program, audit, planned_terms)

    # 3) Build message list (history + new context)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Inject context as an assistant-style note so the model can reference it
    messages.append(
        {
            "role": "assistant",
            "content": "Context for this student:\n" + context,
        }
    )

    # Add prior chat history, if any
    for msg in history:
        if msg.get("role") in ("user", "assistant"):
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Add the latest user query / goals summary
    user_text = (
        f"My goals/preferences: {goals}. "
        f"Additional preferences JSON: {json.dumps(preferences)}. "
        "Given the transcript + audit + planned terms in the context, "
        "help me understand what classes I still need and suggest a multi-semester plan. "
        "Explain *why* you chose each term's courses, and invite me to tweak things "
        "(like max credits, hard vs easy balance, summer usage, etc.)."
    )
    messages.append({"role": "user", "content": user_text})

    # 4) Call OpenAI
    resp = client.chat.completions.create(model=MODEL, messages=messages)
    reply = resp.choices[0].message.content.strip()

    return {
        "reply": reply,
        "audit": audit,
        "planned_terms": planned_terms,
    }