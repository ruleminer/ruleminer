from utils.methods import get_user_token
from utils.methods import load_json
from utils.methods import send_request


def generate_results(dataset: int, dataset_id: int, algorithm_id: int):
    token = get_user_token()
    params_file_path = f"{dataset}/jsons/generation_params_ruleset.json"
    params = load_json(params_file_path)
    params["name"] = f"Generated ruleset for dataset {dataset_id}"
    params["generation_method"] = "RuleKit"
    params["algorithm_id"] = algorithm_id
    response = send_request(
        f"api/datasets/{dataset_id}/ruleset_generation",
        "post", token, json=params,
    )
    return response


def generate_eda_report(dataset_id: int, title: str):
    token = get_user_token()
    response = send_request(
        f"api/datasets/{dataset_id}/generate_eda_report",
        "post", token,
        json={"title": title},
    )
    return response


def generate_prediction_report(dataset_id: int, title: str, analysis_mode: str, scoring: str):
    body = {
        "title": title,
        "settings": {
            "analysis_mode": analysis_mode,
            "scoring": scoring,
            "grid_search": True,
        },
        "preprocessing": {},
        "algorithms": {},
    }
    token = get_user_token()
    response = send_request(
        f"api/datasets/{dataset_id}/generate_prediction_report",
        "post", token, json=body,
    )
    return response


def generate_discovery_report(dataset_id: int, title: str):
    body = {
        "title": title,
        "preprocessing": {},
        "algorithms": {},
    }
    token = get_user_token()
    response = send_request(
        f"api/datasets/{dataset_id}/generate_discovery_report",
        "post", token, json=body,
    )
    return response
