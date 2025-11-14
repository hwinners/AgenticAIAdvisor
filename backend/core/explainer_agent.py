import os, json
from openai import OpenAI
MODEL = os.getenv("MODEL_NAME", "gpt-4o-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
EXPLAIN_SYSTEM = "You explain degree planning decisions clearly and briefly."
def explain_decision(plan_json: dict, req_json: dict, course: str, term: str):
    user = "Given this plan JSON: ```" + json.dumps(plan_json) + "``` and requirements: ```" + json.dumps(req_json) + f"```, answer: Why was {course} placed in {term}? Include prereq chain and credit balance."
    resp = client.chat.completions.create(model=MODEL, messages=[{"role":"system","content":EXPLAIN_SYSTEM},{"role":"user","content":user}])
    return resp.choices[0].message.content.strip()
