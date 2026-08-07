from typing import Any
from typing import Optional

from fastapi import HTTPException


class CustomHTTPException(HTTPException):
    """Base class for implementing custom HTTP exceptions. Such exceptions are
    automatically propagated up to the frontend by portal service. The error_code field
    is mapped to the err_msg_id. This allows to simplify process of handling errors
    originating in REST on the frontend.
    """

    def __init__(self, status_code: int, error_code: str, detail: Optional[Any] = None):
        self.error_code = error_code
        super().__init__(status_code, detail)

    def __str__(self) -> str:
        return f"HTTP: {self.status_code} error_code: {self.error_code}, details: {self.detail}"

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}(status_code={self.status_code!r}, "
            f"error_code={self.error_code!r}, detail={self.detail!r})"
        )


class NotSupportedForRulesWithAlternativesException(CustomHTTPException):
    """Indicates that the operation is not supported for rules containing alternatives
    inside their premised.
    """

    def __init__(self):
        super().__init__(
            status_code=400,
            error_code="not_supported_for_rules_with_alternatives",
            detail=(
                "This operation is not supported for rules containing alternatives. "
                "This error is propagated directly from rules-evaluation service. "
                "For the original exception check the rules-evaluation service logs."
            )
        )
