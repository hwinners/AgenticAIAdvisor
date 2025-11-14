import json, os
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
def load_json(name: str):
    path = name if os.path.isabs(name) else os.path.join(DATA_DIR, name)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
