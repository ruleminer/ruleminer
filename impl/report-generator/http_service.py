import os

from celery.exceptions import BackendStoreError
from http_client.http_client import HttpClient
from http_client.http_client_exceptions import CustomHTTPException
from requests import Response
from requests.exceptions import ConnectionError
from settings import ACCESS_TOKEN_CREDENTIALS
from settings import ACCESS_TOKEN_ENDPOINT


def get_token():
    token_url = f"{ACCESS_TOKEN_ENDPOINT['url_base_path']}{ACCESS_TOKEN_ENDPOINT['access_token_endpoint']}"  # noqa

    http_client: HttpClient = HttpClient()
    try:
        response = http_client \
            .fill_http_client(token_url) \
            .set_header('Content-Type', 'application/x-www-form-urlencoded') \
            .post(ACCESS_TOKEN_CREDENTIALS, is_json=False)
    except ConnectionError:
        raise BackendStoreError()

    if response.status_code == 200:
        return f"Bearer {response.json()['access_token']}"
    else:
        raise BackendStoreError()


class HttpService:
    def __init__(self):
        self.http_client = HttpClient()
        self.http_client.set_scheme(f'{os.environ["WORKER_REST_API_SCHEME"]}') \
            .set_host(f'{os.environ["WORKER_REST_API_HOST"]}:{os.environ["WORKER_REST_API_PORT"]}') \
            .clear_body()

        self.health_check()

    def health_check(self):
        get_token()
        api_ping = self.http_client \
            .set_path('/api/ping') \
            .get()
        if api_ping.status_code != 200:
            raise BackendStoreError()

    def commit_report(self, report_result: dict):
        dataset_id = report_result["dataset_id"]
        response: Response = self.http_client \
            .set_path(f'/api/datasets/{dataset_id}/commit-report') \
            .set_authorization_header(get_token()) \
            .patch(report_result)
        if response.status_code != 201:
            raise CustomHTTPException(response.status_code, response.text)

    def update_task_status(self, task_id: int, new_status: str, error_cause: str = None):
        body = {
            "status": new_status
        }
        if error_cause is not None:
            body["error_cause"] = error_cause
        else:
            body["error_cause"] = ""
        response: Response = self.http_client \
            .set_path(f'/api/tasks/{task_id}/status') \
            .set_authorization_header(get_token()) \
            .patch(body)

        if response.status_code != 200:
            raise CustomHTTPException(response.status_code, response.text)

    def get_task_data(self, task_id: int) -> str:
        response: Response = self.http_client \
            .set_path(f'/api/tasks/{task_id}/status') \
            .set_authorization_header(get_token()) \
            .get()

        if response.status_code == 200:
            return response.json()
        else:
            raise CustomHTTPException(response.status_code, response.text)
