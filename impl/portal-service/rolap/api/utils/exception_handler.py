import json
import logging

from django.utils import timezone
from http_client.http_client_exceptions import CustomHTTPException
from requests import ConnectionError
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rolap.api.exceptions import ExternalServiceException
from rolap.api.exceptions import GeneralApiException

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    logger.exception(exc)

    # First check if the exception comes from calling other services of our app
    if isinstance(exc, CustomHTTPException):
        message = f"An error occurred when calling another service: {exc.message}"
        exc = ExternalServiceException(
            status_code=exc.status_code,
            detail=message,
        )
    if isinstance(exc, ConnectionError):
        message = "Could not connect to an external service"
        exc = ExternalServiceException(
            status_code=500,
            detail=message,
        )

    # Call REST framework's default exception handler,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Add standardized data to error response
    if response is not None:
        response.data["status_code"] = response.status_code
        response.data["time"] = timezone.now()
        if isinstance(exc, GeneralApiException):
            response.data["err_msg_id"] = exc.err_msg_id
            # sometimes we use a JSON string as the detail,
            # so we try to parse it and add as dict;
            # otherwise, we just add the string
            try:
                response.data["detail"] = json.loads(exc.detail)
            except json.JSONDecodeError:
                response.data["detail"] = exc.detail
    # Return generic unexpected error response - details can be looked up in logs
    else:
        response = Response(
            {
                "status_code": 500,
                "time": timezone.now(),
                "detail": "An unknown error occurred",
                "err_msg_id": "unknown_error"
            },
            status=500
        )

    return response
