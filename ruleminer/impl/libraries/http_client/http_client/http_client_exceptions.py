from typing import Optional


class CustomHTTPException(Exception):
    def __init__(self, status_code: int, message: str, error_code: Optional[str] = None):
        self.status_code: int = status_code
        self.message: str = message
        self.error_code: Optional[str] = error_code
        super().__init__(self.message)

    def __str__(self):
        return f"HTTP {self.status_code} error: {self.message}"
