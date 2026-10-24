"""FastAPI application entry point. Routers get included here as modules are built."""
from fastapi import FastAPI

app = FastAPI(title="Car Dealership Inventory API")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
