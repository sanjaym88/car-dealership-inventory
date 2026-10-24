"""FastAPI application entry point. Routers get included here as modules are built."""
from fastapi import FastAPI

from app.api.errors import register_exception_handlers
from app.api.routes import auth, vehicles

app = FastAPI(title="Car Dealership Inventory API")
app.include_router(auth.router)
app.include_router(vehicles.router)
register_exception_handlers(app)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
