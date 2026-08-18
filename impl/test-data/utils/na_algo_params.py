import json
import os
import random
import string

from utils.methods import get_user_token
from utils.methods import send_request


def get_algorithm_path(algorithm_type: str):
    return os.path.join("test-data/test_data/jsons", f"add_algorithm_{algorithm_type}.json")


def make_body_from_answer_string(answer_string: str):
    return {
        "answers": {
            question.split(".")[0]: question.split(".")[1] for question in answer_string.split("_")
        }
    }


def get_answer_body_objects(algorithm_type: str):
    with open(get_algorithm_path(algorithm_type), 'r') as f:
        data = json.load(f)
    answers_and_params = data["na_algorithm_parameters"]
    body_objects = [
        make_body_from_answer_string(x["answer_string"])
        for x in answers_and_params if x["answer_string"] != "default"
    ]
    return body_objects


def create_ruleset(dataset_id: int, body: dict):
    token = get_user_token()
    response = send_request(
        f"api/datasets/{dataset_id}/ruleset_generation",
        "post", token, json=body,
    )
    return response


def get_random_name():
    return "".join(random.choices(string.ascii_lowercase, k=10))
