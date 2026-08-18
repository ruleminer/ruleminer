import re
from enum import Enum
from typing import get_args
from typing import get_origin
from typing import Literal
from typing import Union

from annotated_types import BaseMetadata
from pydantic import BaseModel


class EMAGBaseModel(BaseModel):
    """
    Base class for all models which parametrize reports in EMAG reports library.
    """
    class Config:
        schema_name = None

    def to_params(self) -> dict:
        """
        Converts model to dictionary with upper case keys to pass into Quarto for rendering reports.

        Returns:
            dict: Flattened dictionary with upper case keys and values of parameters
        """
        result = super().model_dump()
        new_result = {}
        for key, value in result.items():
            if isinstance(value, Enum):
                new_result[key.upper()] = value.value
            elif isinstance(getattr(self, key), EMAGBaseModel):
                params = getattr(self, key).to_params()
                new_result = {**new_result, **params}
            else:
                new_result[key.upper()] = value
        return new_result

    @classmethod
    def get_form_schema(cls) -> dict:
        """
        Generates schema which can be used for creating a form in a frontend application.

        Returns:
            dict: JSON schema for form
        """
        name = cls.Config.schema_name or to_snake_case(cls.__name__)
        schema = {
            "name": name,
            "type": "section",
            "properties": [],
            "isSettings": "_settings" in name,
        }
        for field_name, field in cls.model_fields.items():
            is_nullable = get_origin(field.annotation) == Union
            is_fixed = get_origin(field.annotation) == Literal
            is_required = field.is_required()
            field_cls = field.annotation
            if is_nullable or is_fixed:
                field_cls = get_args(field_cls)[0]
            if is_fixed:
                field_cls = type(field_cls)
            if issubclass(field_cls, EMAGBaseModel):
                field_data = field_cls.get_form_schema()
            else:
                field_data = {
                    "name": field_name,
                    "type": field_cls.__name__,
                    "required": is_required,
                    "nullable": is_nullable,
                    "fixed": is_fixed,
                }
                if not is_required:
                    field_data["default"] = field.default
                if issubclass(field_cls, Enum):
                    field_data["type"] = "enum"
                    field_data["options"] = [item.value for item in field_cls]
                if field.metadata:
                    for meta in field.metadata:
                        field_data = {
                            **field_data,
                            **_get_metadata(meta),
                        }

            schema["properties"].append(field_data)
        return schema


def to_snake_case(string: str):
    """
    Converts string to snake case.

    Args:
        string (str): String to convert

    Returns:
        str: String in snake case
    """
    return re.sub(r'(?<!^)(?=[A-Z])', '_', string).lower()


def _get_metadata(obj: BaseMetadata):
    name = obj.__class__.__name__.lower()
    value = getattr(obj, name)
    return {name: value}
