"""Maps domain errors raised by services to HTTP responses, in one place instead of per route."""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.services.vehicle_service import OutOfStockError, VehicleNotFoundError

ERROR_RESPONSES: dict[type[Exception], tuple[int, str]] = {
    VehicleNotFoundError: (status.HTTP_404_NOT_FOUND, "Vehicle not found"),
    OutOfStockError: (status.HTTP_409_CONFLICT, "Vehicle is out of stock"),
}


def register_exception_handlers(app: FastAPI) -> None:
    for error_type, (status_code, detail) in ERROR_RESPONSES.items():

        def handler(_: Request, __: Exception, status_code=status_code, detail=detail):
            return JSONResponse(status_code=status_code, content={"detail": detail})

        app.add_exception_handler(error_type, handler)
