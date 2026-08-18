from celery import states
from celery.backends.base import BaseBackend
from celery.exceptions import BackendStoreError
from http_client.http_client_exceptions import CustomHTTPException
from http_service import HttpService


class RolapHTTPQueueBackend(BaseBackend):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # HTTP service is used to update task status via HTTP
        self.http_service = HttpService()

    def _store_result(self, task_id, result, state, traceback=None, request=None, **kwargs):
        # if the task has been aborted, do not update its status as success
        if self.app.current_task is not None and self.app.current_task.is_aborted():
            return

        # parse failure result
        if state == states.FAILURE:
            result = self.parse_failure_result(result)
        elif state == states.SUCCESS:
            pass
        else:
            result = None

        # store result depending on status and type
        try:
            if state == states.SUCCESS:
                # if successful, store it with a corresponding special "commit" endpoint
                self.http_service.commit_report(result)
            else:
                # update task via HTTP to portal-service
                self.http_service.update_task_status(task_id, state, result)
        except CustomHTTPException as e:
            # raise error so that saving of the result is retried
            raise BackendStoreError(state=state, task_id=task_id) from e

    def parse_failure_result(self, result):
        # by default result for failure is a dictionary:
        # {'exc_type': str, 'exc_message': list[str], 'exc_module': str}
        # we will store only exc_message field which is the exception message
        if isinstance(result, dict) and 'exc_message' in result and len(result['exc_message']) > 0:
            if result["exc_type"] == "WorkerLostError":
                result = "worker_lost"
            else:
                result = result["exc_message"][0]
        else:
            result = "unknown_error"
        return result

    def exception_safe_to_retry(self, exc):
        if isinstance(exc, BackendStoreError):
            return True
        return False

    def mark_as_retry(self, task_id, exc, traceback=None,
                      request=None, store_result=True, state=states.RETRY):
        # We don't need this - the task will continue with status `STARTED`
        pass

    def _get_task_meta_for(self, task_id):
        try:
            return self.http_service.get_task_data(task_id)
        except CustomHTTPException as e:
            raise BackendStoreError(task_id=task_id) from e
