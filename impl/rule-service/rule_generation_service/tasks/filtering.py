import os
import warnings

from calculator import RulesetStatisticCalculator
from celery import current_task
from celery.contrib.abortable import AbortableTask
from clean import sanitize_rules_conclusions
from dataset_reader import read_with_ruleset
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.filtering import filter_ruleset
from decision_rules.serialization import JSONSerializer
from decision_rules.serialization import SerializationModes
from decision_rules.survival.ruleset import SurvivalRuleSet
from exceptions import CalculationError
from exceptions import RulesetProcessingError
from models.common import Attribute
from models.requests import FilterRulesetRequest
from models.results import ApiStatistics
from models.results import RulesetStatistics
from ruleset import configure_ruleset_prediction
from ruleset import deserialize_ruleset
from worker import app

warnings.filterwarnings("ignore", category=RuntimeWarning)


@app.task(name="rule_service.filter_ruleset", queue=os.environ["CELERY_TASK_QUEUE_NAME"], base=AbortableTask)
def calculate_filtered_ruleset(request: dict, task_id: int):
    # check if task has been aborted
    if current_task.is_aborted():
        return

    current_task.backend.mark_as_started(task_id)

    # parse request
    filter_request: FilterRulesetRequest = FilterRulesetRequest(**request)

    # deserialize ruleset from provided data
    try:
        ruleset: AbstractRuleSet = deserialize_ruleset(
            filter_request.ruleset, filter_request.problem_type)
    except Exception as e:
        raise RulesetProcessingError(e)

    configure_ruleset_prediction(ruleset, filter_request.prediction_config)

    # read dataset
    attributes = [
        Attribute(**attr) for attr in filter_request.generation_params["attributes"]
    ]
    X, y = read_with_ruleset(filter_request.dataset_storage_path, ruleset)

    # apply filtering algorithm
    try:
        filtered_ruleset = filter_ruleset(
            ruleset,
            X,
            y,
            filter_request.filter_algorithm,
            filter_request.loss,
            filter_request.prediction_config.voting_measure
        )
    except Exception as e:
        raise CalculationError(e)
    if isinstance(filtered_ruleset, SurvivalRuleSet):
        sanitize_rules_conclusions(filtered_ruleset)

    # serialize filtered ruleset
    try:
        ruleset_json = JSONSerializer.serialize(
            filtered_ruleset, mode=SerializationModes.MINIMAL
        )
    except Exception as e:
        raise RulesetProcessingError(e)

    # calculate stats
    try:
        calculator = RulesetStatisticCalculator(
            ruleset=filtered_ruleset,
            voting_measure=filter_request.prediction_config.voting_measure,
            dataset_path=filter_request.dataset_storage_path
        )
        statistics: RulesetStatistics = calculator.calculate()
    except Exception as e:
        raise CalculationError(e)

    # prepare results
    generation_params = {
        **filter_request.generation_params,
        "filter_algorithm": filter_request.filter_algorithm,
    }
    results = ApiStatistics(
        ruleset_kwargs=filter_request.ruleset_kwargs,
        ruleset=ruleset_json,
        generation_params=generation_params,
        statistics=statistics,
        celery_task=task_id,
        rules_labels=filter_request.rules_labels,
        prediction_config=filter_request.prediction_config,
        extra_info={
            "generated_rules": len(filtered_ruleset.rules)
        },
    )

    return results.model_dump()
