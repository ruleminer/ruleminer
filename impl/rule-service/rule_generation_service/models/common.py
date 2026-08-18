import os
from typing import Optional

from pydantic import BaseModel
from pydantic import constr


class Attribute(BaseModel):
    name: constr(
        strip_whitespace=True,
        pattern=os.environ['ATTRIBUTES_REGEX']
    )
    role: constr(strip_whitespace=True, pattern=r'^[a-zA-Z0-9\s\-_]+$')


class PredictionConfig(BaseModel):
    prediction_strategy: str
    use_default_rule: bool
    voting_measure: Optional[str] = None
