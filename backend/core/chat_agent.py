# backend/core/chat_agent.py

import os
import json
from typing import List, Dict, Any
from openai import OpenAI

from .audit import audit_program
from .planner import greedy_plan

MODEL = os.getenv("MODEL_NAME", "gpt-4o-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are an academic advising assistant for engineering students.

You:
- Read the student's transcript, degree audit, and planned pathway.
- Identify missing requirements and important prerequisites.
- Suggest multi-semester course pathways that keep the student on track to graduate.
- Take into account student goals and preferences (e.g., max credits per term, difficulty balance).
- Explain your recommendations clearly and briefly in friendly language.

Rules:
- Do NOT invent courses that are not in the catalog JSON.
- Respect prerequisites in the plan JSON (do not schedule a course before its prereqs).
- If you are unsure, say what assumptions you're making.
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
) -> Dict[str, Any]:
    """
    High-level agent:
    - Runs the course/degree engine (audit + planner)
    - Calls the LLM to have a conversation and explain recommendations
    """
    # 1) Core engine: audit + plan
    audit = audit_program(transcript, program)
    _, planned_terms = greedy_plan(transcript, program, term_sequence)

    # 2) Build context for the LLM
    context = build_context_blocks(transcript, program, audit, planned_terms)

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
