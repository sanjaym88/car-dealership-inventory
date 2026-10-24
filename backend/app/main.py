"""FastAPI application entry point. Routers get included here as modules are built."""
from fastapi import FastAPI

from app.api.routes import auth

app = FastAPI(title="Car Dealership Inventory API")
app.include_router(auth.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
