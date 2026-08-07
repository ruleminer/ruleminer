import json
import os

import pandas as pd
import requests
from utils.methods import generate_path
from utils.methods import get_operator_token
from utils.methods import get_user_token
from utils.methods import load_json
from utils.methods import prepare_dataframe_for_upload
from utils.methods import send_request


def upload_algorithm(algorithm_filename: str) -> requests.Response:
    token = get_operator_token()
    algorithm_body = load_json(algorithm_filename)
    return send_request(
        "manage/algorithms/", "post", token, json=algorithm_body
    )


def upload_subscription_plan(plan_name: str) -> requests.Response:
    token = get_operator_token()
    plan_body = {
        "name": plan_name,
    }
    return send_request(
        "manage/subscription_plans/", "post", token, json=plan_body
    )


def upload_dataset(dataset: int, project_id: int) -> requests.Response:
    dataset_data = load_json(f"{dataset}/dataset/description.json")
    dataset_filepath = generate_path(f"{dataset}/dataset/data.csv")
    dataset = pd.read_csv(dataset_filepath)
    file = prepare_dataframe_for_upload(dataset)
    token = get_user_token()
    response = send_request(
        f"api/project/{project_id}/upload", "put", token,
        data={
            "data": json.dumps(dataset_data),
        },
        files={"file": file},
    )
    return response


def upload_ruleset(dataset_folder: int, dataset_id: int) -> list[requests.Response]:
    dataset_filepath = generate_path(f"{dataset_folder}/dataset/data.csv")
    dataset = pd.read_csv(dataset_filepath)
    ruleset_path = generate_path(f"{dataset_folder}/ruleset")
    ruleset_files = [file for file in os.listdir(
        ruleset_path) if "json" in file]
    responses = []
    for i, ruleset_file in enumerate(ruleset_files):
        # load ruleset
        ruleset_file_path = f"{ruleset_path}/{ruleset_file}"
        ruleset_data = load_json(ruleset_file_path)

        # load parameter files
        params_file_path = ruleset_file_path.replace(
            "ruleset/", "jsons/generation_params_")
        data = load_json(params_file_path)

        # parse algorithm params and attributes
        algorithm_params = data.pop("algorithm_params")
        to_skip = data.pop("attributes_to_skip", [])
        all_attributes = dataset.columns
        attr_attrs = all_attributes[:-1]
        class_attr = all_attributes[-1]
        included_attributes = list(set(attr_attrs).difference(to_skip))
        attributes = [
            {"name": a, "role": "attr"}
            for a in included_attributes
        ]
        attributes.append({"name": class_attr, "role": "class"})
        generation_params = {
            "algorithm_params": algorithm_params,
            "attributes": attributes,
        }

        # complete the data
        data["generation_params"] = generation_params
        data["attached_to_dataset_id"] = dataset_id
        data["ruleset"] = ruleset_data
        data["rules_labels"] = {
            rule['uuid']: [] for rule in ruleset_data['rules']
        }

        token = get_user_token()
        response = send_request(
            f"api/create_ruleset/", "post", token, json=data,
        )
        responses.append(response)
    return responses
