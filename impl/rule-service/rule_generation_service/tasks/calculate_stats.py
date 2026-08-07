import os

import numpy as np
from calculator import RulesetStatisticCalculator
from celery import current_task
from celery.contrib.abortable import AbortableTask
from dataset_reader import read_from_storage
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.serialization import JSONSerializer
from decision_rules.serialization import SerializationModes
from decision_rules.survival import SurvivalRuleSet
from decision_rules.helpers import get_measure_function_by_name
from models.requests import CalculateStatsRequest
from models.results import ApiStatistics
from models.results import RulesetStatistics
from ruleset import configure_ruleset_prediction
from ruleset import deserialize_ruleset
from ruleset import update_ruleset_meta
from worker import app

from exceptions import CalculationError
from exceptions import RulesetProcessingError
from exceptions import BaseRuleServiceException


def remove_non_covering_rules(ruleset, x_df, stats_request):
    """
    Removes rules from the ruleset that do not cover any data points in the dataset.
    Updates the ruleset and stats_request accordingly.
    """
    coverage_matrix = ruleset.calculate_coverage_matrix(x_df)
    covering_rules_mask = coverage_matrix.sum(0) > 0
    if covering_rules_mask.all():
        return None

    rules = np.array(ruleset.rules)
    ruleset.rules = rules[covering_rules_mask].tolist()
    new_labels = {}
    for rule in ruleset.rules:
        new_labels[rule.uuid] = stats_request.rules_labels[rule.uuid]
    stats_request.rules_labels = new_labels
    removed_rules = rules[~covering_rules_mask].tolist()
    comments = [{
        "code": "non_covering_rules_removed",
        "context": [
            JSONSerializer.serialize(rule, mode=SerializationModes.MINIMAL) for rule in removed_rules
        ],
    }]
    return comments


@app.task(name="rule_service.calculate_indicators", queue=os.environ["CELERY_TASK_QUEUE_NAME"], base=AbortableTask)
def calculate_stats(request: dict, task_id: int):
    # check if task has been aborted
    if current_task.is_aborted():
        return

    current_task.backend.mark_as_started(task_id)

    # parse request
    stats_request: CalculateStatsRequest = CalculateStatsRequest(**request)

    x_df, y_df = read_from_storage(
        attributes=stats_request.attributes, storage_path=stats_request.dataset_storage_path)

    try:
        ruleset: AbstractRuleSet = deserialize_ruleset(
            stats_request.ruleset, stats_request.problem_type)
        comments = remove_non_covering_rules(ruleset, x_df, stats_request)
        if isinstance(ruleset, SurvivalRuleSet):
            ruleset.update(x_df, y_df)
        else:
            measure = get_measure_function_by_name(
                stats_request.prediction_config.voting_measure)
            ruleset.update(x_df, y_df, measure)

    except BaseRuleServiceException as error:
        raise error
    except Exception as e:
        raise RulesetProcessingError(e)

    configure_ruleset_prediction(ruleset, stats_request.prediction_config)

    # calculate stats
    try:
        calculator = RulesetStatisticCalculator(
            ruleset=ruleset,
            voting_measure=stats_request.prediction_config.voting_measure,
            dataset_path=stats_request.dataset_storage_path,
        )
        statistics: RulesetStatistics = calculator.calculate()
    except Exception as e:
        raise CalculationError(e)

    generation_params = {
        "algorithm_params": stats_request.algorithm_params,
        "attributes": stats_request.attributes,
    }

    update_ruleset_meta(ruleset, stats_request.attributes,
                        stats_request.dataset_storage_path)
    ruleset_json = JSONSerializer.serialize(
        ruleset, mode=SerializationModes.MINIMAL
    )

    # prepare results
    results = ApiStatistics(
        ruleset_kwargs=stats_request.ruleset_kwargs,
        ruleset=ruleset_json,
        generation_params=generation_params,
        statistics=statistics,
        rules_labels=stats_request.rules_labels,
        celery_task=task_id,
        overwrite_ruleset_id=stats_request.overwrite_ruleset_id,
        prediction_config=stats_request.prediction_config,
        comments=comments,
    )

    return results.model_dump()
