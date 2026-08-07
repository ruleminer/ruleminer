import json

from utils.methods import get_operator_token
from utils.methods import load_json
from utils.methods import send_request
from utils.uploaders import upload_algorithm
from utils.uploaders import upload_subscription_plan


def populate():
    # SECTION 1: Manage database - algorithms with related & voting measures

    # add classification algorithms
    response = upload_algorithm("jsons/algorithms/rulekit/classification.json")
    assert response.status_code == 201, response.content
    print("Successfully uploaded RuleKit classification algorithm.")

    response = upload_algorithm(
        "jsons/algorithms/deeprules/classification.json")
    assert response.status_code == 201, response.content
    print("Successfully uploaded DeepRules classification algorithm.")

    # add regression algorithms
    response = upload_algorithm("jsons/algorithms/rulekit/regression.json")
    assert response.status_code == 201, response.content
    print("Successfully uploaded RuleKit regression algorithm.")

    response = upload_algorithm("jsons/algorithms/deeprules/regression.json")
    assert response.status_code == 201, response.content
    print("Successfully uploaded DeepRules regression algorithm.")

    # add survival algorithms
    response = upload_algorithm("jsons/algorithms/rulekit/survival.json")
    assert response.status_code == 201, response.content
    print("Successfully uploaded RuleKit survival algorithm.")

    response = upload_algorithm("jsons/algorithms/deeprules/survival.json")
    assert response.status_code == 201, response.content
    print("Successfully uploaded DeepRules survival algorithm.")

    # add voting measures
    token = get_operator_token()
    voting_measure_body = load_json("jsons/add_voting_measures.json")
    create_voting_measures = send_request(
        "manage/voting_measures", "post", token, json=voting_measure_body
    )
    assert create_voting_measures.status_code == 201, create_voting_measures.content
    print("Successfully added voting measures")

    # add the supported algorithms for importing external rule sets.
    token = get_operator_token()
    import_ruleset_algorithm_body = load_json(
        "jsons/add_algorithm_for_upload_ruleset.json")
    create_import_ruleset_algorithms = send_request(
        "manage/import_ruleset_algorithms", "post", token, json=import_ruleset_algorithm_body
    )
    assert create_import_ruleset_algorithms.status_code == 201, create_import_ruleset_algorithms.content
    print("Successfully added algorithms (supported for importing external rulesets)")

    # add subscription plans
    free_plan = upload_subscription_plan("FREE")
    assert free_plan.status_code == 201, free_plan.content
    print("Successfully added FREE subscription plan.")
    free_plan_id = json.loads(free_plan.content)["id"]
    premium_plan = upload_subscription_plan("CUSTOM")
    assert premium_plan.status_code == 201, premium_plan.content
    print("Successfully added CUSTOM subscription plan.")

    # add limit group
    token = get_operator_token()
    limit_group_body = load_json("jsons/add_limit_group.json")
    limit_group_body["plan"] = free_plan_id
    create_limit_group = send_request(
        "manage/limit_groups/", "post", token, json=limit_group_body
    )
    assert create_limit_group.status_code == 201, create_limit_group.content
    print("Successfully added limit group for `rolap_user`.")


if __name__ == "__main__":
    populate()
