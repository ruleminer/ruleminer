from typing import Any
from typing import Optional

from pydantic import BaseModel
from pydantic import ConfigDict


class RulesetMeta(BaseModel):
    model_config = ConfigDict(extra='allow')

    attributes: list[str]
    decision_attribute: str


class Premise(BaseModel):
    model_config = ConfigDict(extra='allow')

    type: str
    operator: str
    subconditions: list[dict]


class Conclusion(BaseModel):
    model_config = ConfigDict(extra='allow')

    value: Any


class RuleCoverage(BaseModel):
    model_config = ConfigDict(extra='allow')

    p: int
    n: int


class Rule(BaseModel):
    model_config = ConfigDict(extra='allow')

    uuid: str
    string: str
    premise: dict
    conclusion: Conclusion
    coverage: Optional[RuleCoverage] = None


class Ruleset(BaseModel):
    meta: RulesetMeta
    rules: list[Rule]
