import uuid
from typing import Optional

from rolap.api.exceptions import RuleNotFoundException
from rolap.api.exceptions import RulesetNotFoundException
from rolap.api.models import Rules
from rolap.api.models import Ruleset
from rolap.api.models.rulesets.rulesets_db import DEFAULT_MEASURE
from rolap.api.models.rulesets.rulesets_db import INDUCTION_MEASURE_PARAMETER


def get_ruleset(ruleset_id: int, dataset_id: int) -> Ruleset:
    ruleset_query = Ruleset.objects \
        .filter(id=ruleset_id) \
        .filter(attached_to_dataset_id=dataset_id)

    if not ruleset_query.exists():
        raise RulesetNotFoundException()

    return ruleset_query.first()


def get_rule(ruleset_id: int, rule_uuid: uuid) -> Rules:
    rule_query = Rules.objects \
        .filter(ruleset=ruleset_id) \
        .filter(uuid=rule_uuid)

    if not rule_query.exists():
        raise RuleNotFoundException()

    return rule_query.first()


def _get_ruleset_measure(generation_params: dict, measure_param_name: str) -> Optional[str]:
    algorithm_params: dict = generation_params.get("algorithm_params", {})
    induction_measure: str = algorithm_params.get(measure_param_name)
    return str(induction_measure) if induction_measure is not None else DEFAULT_MEASURE


def get_ruleset_induction_measure(generation_params: dict) -> Optional[str]:
    return _get_ruleset_measure(generation_params, INDUCTION_MEASURE_PARAMETER)
