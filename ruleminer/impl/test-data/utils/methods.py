import io
import json
import os
import sys

import pandas as pd
import requests
from dotenv import load_dotenv


# Load all environment files passed as arguments
for env_file in sys.argv[1:]:
    load_dotenv(env_file)

try:
    HOST = os.environ["HOST"]

    API_HOST = f"http://{HOST}:{os.environ['REST_API_HOST_PORT']}/"
    KEYCLOAK_HOST = f"http://{HOST}:{os.environ['KEYCLOAK_HTTP_HOST_PORT']}/"

    auth_body = {
        "client_id": os.environ["KEYCLOAK_CLIENT_ID"],
        "grant_type": "password",
        "scope": "openid profile email",
    }
    if os.environ.get("KEYCLOAK_CLIENT_SECRET"):
        auth_body["client_secret"] = os.environ["KEYCLOAK_CLIENT_SECRET"]
except KeyError as e:
    print(f"Missing environment variable: {e}")
    sys.exit(1)


def get_token(body: dict):
    response = requests.post(
        f"{KEYCLOAK_HOST}auth/realms/ROLAP/protocol/openid-connect/token",
        data=body,
    )
    content = json.loads(response.content)
    return content["access_token"]


def get_user_token() -> str:
    auth_body["username"] = "john"
    auth_body["password"] = os.environ["JOHN_PASSWORD"]
    return get_token(auth_body)


def get_operator_token() -> str:
    auth_body["username"] = "operator"
    auth_body["password"] = os.environ["OPERATOR_PASSWORD"]
    return get_token(auth_body)


def send_request(endpoint: str, method: str, auth_token: str, **kwargs):
    auth_header = {"Authorization": f"Bearer {auth_token}"}
    response = requests.request(
        url=f"{API_HOST}{endpoint}", method=method, headers=auth_header, **kwargs
    )
    return response


def generate_path(filename: str) -> str:
    dir_path = os.path.dirname(os.path.realpath(__file__))
    return os.path.join(dir_path, "../test_data", filename)


def load_json(filename: str) -> dict:
    path = generate_path(filename)
    with open(path, encoding="utf-8") as file:
        data = json.load(file)
    return data


def prepare_dataframe_for_upload(df: pd.DataFrame) -> io.BytesIO:
    file = io.BytesIO()
    df.to_csv(file, index=False)
    file.seek(0)
    return file
