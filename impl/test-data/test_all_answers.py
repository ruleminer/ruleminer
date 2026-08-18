from utils.na_algo_params import create_ruleset
from utils.na_algo_params import get_answer_body_objects
from utils.na_algo_params import get_random_name

DATASET_ID = 1
ALGORITHM_ID = 1
PROBLEM_TYPE = "classification"


def test_all_answers():
    options = get_answer_body_objects(PROBLEM_TYPE)
    responses = []
    for option in options:
        body = {
            "survey": option,
            "dataset_id": DATASET_ID,
            "algorithm_id": ALGORITHM_ID,
            "generation_method": "RuleKit",
            "name": get_random_name(),
            "description": "description",
            "attributes_to_skip": [],
            "cross_validation": False,
            "prediction_config": {
                "prediction_strategy": "vote",
                "use_default_rule": True,
                "voting_measure": "Precision"
            },
        }
        response = create_ruleset(DATASET_ID, body)
        responses.append(response)
    assert all([response.status_code == 201 for response in responses])
    print(
        f"Successfully posted creation of rulesets for {PROBLEM_TYPE} problem with all answer combinations.")


if __name__ == "__main__":
    test_all_answers()
