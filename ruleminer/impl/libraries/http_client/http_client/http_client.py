from urllib.parse import urlparse

import requests


class HttpClient:
    headers: dict = None

    scheme: str = None
    host: str = None
    path: str = None
    query: str = None

    body: dict = None

    def __init__(self):
        self.headers = self.generate_default_headers()
        self.scheme = 'https'
        self.host = 'localhost:8000'
        self.path = ''
        self.query = ''

    def set_header(self, key: str, value: str):
        self.headers[key] = value
        return self

    def fill_http_client(self, url):
        parsed_url = urlparse(url)

        self.scheme = parsed_url.scheme
        self.host = parsed_url.netloc
        self.path = parsed_url.path
        self.query = parsed_url.query

        return self

    def set_authorization_header(self, token):
        self.headers['Authorization'] = token
        return self

    def clear_authorization_header(self):
        self.headers.pop('Authorization', None)
        return self

    def set_body(self, body):
        self.body = body
        return self

    def clear_body(self):
        self.body = None
        return self

    def set_scheme(self, scheme):
        self.scheme = scheme
        return self

    def set_host(self, host):
        self.host = host
        return self

    def set_path(self, path):
        self.path = path
        return self

    def set_query(self, query):
        self.query = query
        return self

    def get_path(self):
        temp_path = f"{self.scheme}://{self.host}{self.path}{self.query}"
        return temp_path

    def get(self):
        return requests.get(self.get_path(), headers=self.headers)

    def post(self, data, is_json=True):
        if is_json:
            return requests.post(self.get_path(), headers=self.headers, json=data)
        else:
            return requests.post(self.get_path(), headers=self.headers, data=data)

    def put(self, data, is_json=True):
        if is_json:
            return requests.post(self.get_path(), headers=self.headers, json=data)
        else:
            return requests.post(self.get_path(), headers=self.headers, data=data)

    def patch(self, data, is_json=True):
        if is_json:
            return requests.patch(self.get_path(), headers=self.headers, json=data)
        else:
            return requests.patch(self.get_path(), headers=self.headers, data=data)

    def delete(self):
        return requests.delete(self.get_path(), headers=self.headers)

    @staticmethod
    def generate_default_headers():
        return {
            'Content-Type': 'application/json'
        }
