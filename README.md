# Car Dealership Inventory System

TDD kata: full-stack inventory system (REST API + React/Tailwind SPA).

## Structure
- `backend/`  - REST API, auth (JWT), vehicles, search, inventory (modules B1-B6)
- `frontend/` - React + Tailwind SPA (modules F1-F6)
- `docs/`     - design notes, test report, screenshots

## Tech stack
- Backend: Python 3.12, FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Testing: Pytest + HTTPX, Vitest + Testing Library
- CI: GitHub Actions

## Setup
Prerequisites: Python 3.12, Node.js 24, Docker.

```bash
docker compose up -d            # dev DB on 5432, test DB on 5433
```

Backend:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate           # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env           # macOS/Linux: cp
alembic upgrade head
python -m app.scripts.create_admin --email admin@example.com   # prompts for a password
uvicorn app.main:app --reload    # http://localhost:8000/docs
pytest
```

Frontend:
```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173 (proxies /api to :8000)
npm test
```

## My AI Usage
_TODO: tools used, how I used them, reflection._

## Test Report
_TODO_
