import os
from openai import OpenAI

# Backend agents share one client + model setting to guarantee gpt-4o-mini usage.
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-4o-mini"

__all__ = ["client", "MODEL"]
