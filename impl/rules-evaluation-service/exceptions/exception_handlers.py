import logging
from logging.config import dictConfig

from exceptions.exceptions import CustomHTTPException
from fastapi.exception_handlers import http_exception_handler
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.utils import is_body_allowed_for_status_code
from settings.common import LOGGING
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.responses import Response

dictConfig(LOGGING)
logger = logging.getLogger("rules_evaluation_service")


async def custom_http_exception_handler(request: Request, exc: HTTPException) -> Response:
    exception_details = {
        "detail": exc.detail,
        "status_code": exc.status_code,
    }
    error_code: str = exc.error_code if isinstance(
        exc, CustomHTTPException) else None
    if error_code:
        exception_details["error_code"] = error_code
    logger.exception(exception_details)

    headers = getattr(exc, "headers", None)

    error_response_body: dict = {"detail": exc.detail}
    if error_code:
        error_response_body["error_code"] = error_code

    if not is_body_allowed_for_status_code(exc.status_code):
        return Response(status_code=exc.status_code, headers=headers)
    return JSONResponse(
        error_response_body, status_code=exc.status_code, headers=headers
    )


async def custom_request_validation_exception_handler(
        request: Request, exc: RequestValidationError
) -> JSONResponse:
    exception_details = {
        "errors": exc.errors,
    }
    logger.exception(exception_details)
    return await request_validation_exception_handler(request, exc)


async def other_exception_handler(_: Request, exc: Exception):
    logger.exception(exc)
    raise exc
