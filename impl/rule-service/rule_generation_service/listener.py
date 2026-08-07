from time import perf_counter

from celery.contrib.abortable import ABORTED
from exceptions import TaskAborted
from rulekit.events import RuleInductionProgressListener
from rulekit.rules import BaseRule


class RuleTrainingProgressListener(RuleInductionProgressListener):
    interval = 10

    def __init__(self, task, task_id):
        super().__init__()
        self.task = task
        self.task_id = task_id
        self.number_of_rules = 0
        self.time = perf_counter()

    def on_new_rule(self, _rule: BaseRule):
        self.number_of_rules += 1

    def on_progress(
        self,
        total_examples_count: int,
        uncovered_examples_count: int
    ):
        # only update meta if enough time has passed since the last update
        current_time = perf_counter()
        if current_time - self.time < self.interval:
            return
        meta = {
            "total_examples_count": total_examples_count,
            "uncovered_examples_count": uncovered_examples_count,
            "generated_rules": self.number_of_rules,
        }
        self.task.backend.update_task_meta(self.task_id, meta)
        self.time = perf_counter()

    def should_stop(self) -> bool:
        task_status = self.task.backend.get_state(self.task_id)
        if task_status == ABORTED:
            raise TaskAborted()
        return task_status == "STOPPING"


class CrossValidationProgressListener(RuleInductionProgressListener):
    def __init__(self, task, task_id):
        super().__init__()
        self.task = task
        self.task_id = task_id

    def should_stop(self) -> bool:
        is_aborted = self.task.is_aborted()
        if is_aborted:
            raise TaskAborted()
        return False
