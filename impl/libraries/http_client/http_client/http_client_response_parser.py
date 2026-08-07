from typing import Dict
from typing import Optional
from typing import Type
from typing import TypeVar

import requests
from pydantic import BaseModel
from pydantic import ValidationError
from requests import Response

from .http_client_exceptions import CustomHTTPException

# Define a type variable
T = TypeVar('T', bound=BaseModel)


class HttpClientResponseParser:
    def parse_with_response(self, response: Response, model: Type[T], is_dict: bool = False) -> T:
        if response.status_code != 200:
            response_json: dict = self._try_parsing_response_body_to_json(
                response)
            error_message: str = response_json.get('detail', response.text)
            error_code: Optional[str] = response_json.get('error_code', None)
            raise CustomHTTPException(
                response.status_code, error_message, error_code)

        if not response.content:
            raise CustomHTTPException(
                response.status_code, "Error: received empty response")

        response_json = self._try_parsing_response_body_to_json(response)

        try:
            if is_dict:
                return response_json
            return model(**response_json)

        except ValidationError as e:
            raise CustomHTTPException(
                response.status_code, f"Error: response does not match the expected model: {e}") from e

    def _try_parsing_response_body_to_json(self, response: Response) -> dict:
        try:
            return response.json()
        except requests.exceptions.JSONDecodeError as e:
            raise CustomHTTPException(
                response.status_code, "Error: could not decode JSON response") from e

    def is_dict_type(self, model: Type) -> bool:
        return issubclass(model, Dict)

    def parse(self, response: Response):
        if response.status_code < 200 or response.status_code >= 300:
            raise CustomHTTPException(response.status_code, response.text)

        if response.content:
            raise CustomHTTPException(
                response.status_code, "Error: expected no content, but content was received")

        return True

# response = requests.get('http://example.com')
# parsed_response = parse_response(response, MyModel)
