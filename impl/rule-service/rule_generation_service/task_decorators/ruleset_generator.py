import os
from time import perf_counter
from typing import Optional

import pandas as pd
from calculator import RulesetStatisticCalculator
from celery import current_task
from celery.contrib.abortable import AbortableTask
from dataset_reader import read_columns
from dataset_reader import read_from_storage
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.serialization import JSONSerializer
from decision_rules.serialization import SerializationModes
from exceptions import BaseRuleServiceException
from exceptions import CalculationError
from exceptions import RulesetGenerationError
from exceptions import RulesetProcessingError
from exceptions import TaskAborted
from listener import RuleTrainingProgressListener
from models.requests import CreateRulesetRequest
from models.results import ApiRuleset
from models.results import RulesetStatistics
from ruleset import update_ruleset_meta
from worker import app


class RulesetGenerator:
    def __init__(self, task_name: str, algorithm_name: str):
        self.queue_name: str = os.environ["CELERY_TASK_QUEUE_NAME"]
        self.task_name: str = f"rule_service.{algorithm_name}.{task_name}"
        self.problem_type: str = task_name

        self.worker_function: callable = None
        self.task_id: int = None
        self.ruleset_request: CreateRulesetRequest = None
        self.generation_time: float = None
        self.statistics: RulesetStatistics = None

    def __call__(self, worker_function):
        @app.task(name=self.task_name, queue=self.queue_name, base=AbortableTask)
        def wrapper(request_object: dict, task_id: int):
            self.task_id = task_id
            self.worker_function = worker_function
            # check if task has been aborted
            if current_task.is_aborted():
                return

            current_task.backend.mark_as_started(task_id)
            self.ruleset_request = CreateRulesetRequest.validate_request(
                request_object
            )
            X, y = read_from_storage(
                attributes=self.ruleset_request.attributes,
                storage_path=self.ruleset_request.dataset_storage_path
            )
            ruleset, should_abort = self._train_ruleset(X, y)

            # check if has been aborted during run - if yes, we do not save results
            if should_abort or current_task.is_aborted():
                return

            # calculate statistics
            try:
                self._calculate_statistics(ruleset)
            except Exception as e:
                raise CalculationError(e) from e

            # prepare results
            try:
                return self._prepare_results(ruleset, X)
            except Exception as e:
                raise RulesetProcessingError(e) from e

        return wrapper

    def _train_ruleset(
            self,
            X: pd.DataFrame,
            y: pd.Series,
    ) -> Optional[tuple[AbstractRuleSet, bool]]:
        """Train ruleset using appropriate function

        Raises:
            RulesetGenerationError: _description_

        Returns:
            tuple[AbstractRuleSet, bool]: ruleset and whether task execution should be aborted
        """
        should_abort = False
        listener = RuleTrainingProgressListener(current_task, self.task_id)
        start = perf_counter()
        try:
            ruleset: AbstractRuleSet = self.worker_function(
                self.ruleset_request, X, y, listener
            )
        except TaskAborted:
            return None, True
        except BaseRuleServiceException as error:
            raise error
        except Exception as error:
            raise RulesetGenerationError(error) from error
        stop = perf_counter()
        self.generation_time = stop - start

        # if the task was stopped, we do not perform cross-validation
        try:
            if listener.should_stop():
                self.ruleset_request.cross_validation = False
                self.ruleset_request.num_folds = None
        except TaskAborted:
            should_abort = True

        return ruleset, should_abort

    def _calculate_statistics(self, ruleset: AbstractRuleSet):
        calculator = RulesetStatisticCalculator(
            ruleset=ruleset,
            voting_measure=self.ruleset_request.prediction_config.voting_measure,
            dataset_path=self.ruleset_request.dataset_storage_path,
        )
        self.statistics = calculator.calculate()

    def _prepare_results(self, ruleset: AbstractRuleSet, X: pd.DataFrame) -> Optional[dict]:
        # check if has been aborted during run - if yes, we do not save results
        if current_task.is_aborted():
            return

        coverage_matrix = ruleset.calculate_coverage_matrix(X)

        # check if has been aborted during run - if yes, we do not save results
        if current_task.is_aborted():
            return

        total_examples_count = int(coverage_matrix.shape[0])
        uncovered_examples_count = int(
            total_examples_count - coverage_matrix.any(1).sum())

        update_ruleset_meta(ruleset, self.ruleset_request.attributes,
                            self.ruleset_request.dataset_storage_path)

        generation_params = {
            'algorithm_params': self.ruleset_request.algorithm_params,
            'attributes': self.ruleset_request.attributes,
        }
        if self.ruleset_request.expert_induction:
            generation_params['expert_induction'] = self.ruleset_request.expert_induction

        api_ruleset: ApiRuleset = ApiRuleset(
            name=self.ruleset_request.name,
            description=self.ruleset_request.description,
            celery_task=self.task_id,
            generation_params=generation_params,
            algorithm_id=self.ruleset_request.algorithm_id,
            ruleset=JSONSerializer.serialize(
                ruleset, mode=SerializationModes.MINIMAL
            ),
            cross_validation=self.ruleset_request.cross_validation,
            num_folds=self.ruleset_request.num_folds,
            generated_from_dataset_id=self.ruleset_request.dataset_id,
            attached_to_dataset_id=self.ruleset_request.dataset_id,
            generation_time=self.generation_time,
            extra_info={
                "generated_rules": len(ruleset.rules),
                "total_examples_count": total_examples_count,
                "uncovered_examples_count": uncovered_examples_count,
            },
            prediction_config=self.ruleset_request.prediction_config,
            statistics=self.statistics,
        )
        return api_ruleset.model_dump()
