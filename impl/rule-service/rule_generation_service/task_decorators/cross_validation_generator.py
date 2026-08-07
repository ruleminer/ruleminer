import os

import pandas as pd
from celery import current_task
from celery.contrib.abortable import AbortableTask
from dataset_reader import read_from_storage
from exceptions import BaseRuleServiceException
from exceptions import CalculationError
from exceptions import RulesetProcessingError
from exceptions import TaskAborted
from listener import CrossValidationProgressListener
from models.requests import CrossValidationRequest
from models.results import ApiCrossValidation
from settings.common import ROUND_DECIMAL_PLACES
from sklearn.model_selection import KFold
from sklearn.model_selection import StratifiedKFold
from worker import app


class CrossValidationFactory:
    def __init__(self):
        self._strategies = {
            "regression_cross_validation": KFold(n_splits=5, shuffle=True, random_state=42),
            "classification_cross_validation": StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
        }

    def get_strategy(self, task_name):
        # Default to KFold
        return self._strategies.get(task_name, KFold(n_splits=5, shuffle=True, random_state=42))


class CrossValidationGenerator:
    def __init__(self, task_name: str, algorithm_name: str):
        self.cv_factory = CrossValidationFactory()
        self.queue_name = os.environ["CELERY_TASK_QUEUE_NAME"]
        self.task_name = f"rule_service.{algorithm_name}.{task_name}"

    def __call__(self, worker_function):
        @app.task(name=self.task_name, queue=self.queue_name, base=AbortableTask)
        def wrapper(request_object: dict, task_id: int):
            # check if task has been aborted before it started
            if current_task.is_aborted():
                return

            current_task.backend.mark_as_started(task_id)
            # create request
            ruleset_request: CrossValidationRequest = CrossValidationRequest.validate_request(
                request_object)

            # read data from storage
            x_df, y_df = read_from_storage(
                attributes=ruleset_request.attributes, storage_path=ruleset_request.dataset_storage_path,
            )

            # initialize results
            cv_strategy = self.cv_factory.get_strategy(self.task_name)
            results = pd.DataFrame()

            # check if aborted before loop start
            if current_task.is_aborted():
                return

            listener = CrossValidationProgressListener(current_task, task_id)

            # perform cross-validation iteration
            for train_index, test_index in cv_strategy.split(x_df, y_df):
                # perform split
                x_train, x_test = x_df.iloc[train_index], x_df.iloc[test_index]
                y_train, y_test = y_df.iloc[train_index], y_df.iloc[test_index]

                # obtain iteration results
                try:
                    cv_iteration_result = worker_function(
                        ruleset_request, x_train, y_train, x_test, y_test, listener)
                except TaskAborted:
                    return
                except BaseRuleServiceException as error:
                    raise error
                except Exception as e:
                    raise CalculationError(e)

                # check if aborted
                if current_task.is_aborted():
                    return

                # concatenate results
                series = pd.Series(cv_iteration_result)
                results = pd.concat([results, series], axis=1)

            # process results
            try:
                results = results.T.describe().T.drop(
                    "count", axis=1).rename(columns={"mean": "avg"})
                results = results.round(decimals=ROUND_DECIMAL_PLACES)
            except Exception as e:
                raise RulesetProcessingError(e)

            # check if aborted
            if current_task.is_aborted():
                return

            # prepare request data
            api_cross_validation: ApiCrossValidation = ApiCrossValidation(
                ruleset=ruleset_request.ruleset_id,
                num_folds=ruleset_request.num_folds,
                celery_task=task_id,
                result=results.to_dict(),
                prediction_config=ruleset_request.prediction_config,
            )

            return api_cross_validation.model_dump()

        return wrapper
