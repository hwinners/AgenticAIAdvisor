# AgenticAIAdvisor
This is for FAU Hackathon 2025 :)

# Instructions
To access the system you need two terminals, one for backend and the other for frontend:
When you first open your terminal:
cd backend
python -m venv .venv
    MAC: source .venv/bin/activate     
    Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 800


cd frontend
npm install
npm run dev


Once you are already in and you happen to kill the terminals:
cd backend
.venv\Scripts\activate
uvicorn app:app --reload --port 8001

cd frontend
npm install
npm run dev