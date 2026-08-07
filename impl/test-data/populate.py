import json

from utils.generators import generate_discovery_report
from utils.generators import generate_eda_report
from utils.generators import generate_prediction_report
from utils.generators import generate_results
from utils.methods import get_operator_token
from utils.methods import get_user_token
from utils.methods import load_json
from utils.methods import send_request
from utils.status_check import verify_script_success
from utils.uploaders import upload_algorithm
from utils.uploaders import upload_dataset
from utils.uploaders import upload_ruleset
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

    # SECTION 2: Classification

    # create classification project
    project_body = load_json("jsons/classification_project.json")
    token = get_user_token()
    create_project = send_request(
        "api/projects", "post", token, data=project_body
    )
    assert create_project.status_code == 201, create_project.content
    print("Successfully created classification project.")
    classification_project_id = json.loads(create_project.content)["id"]

    # upload datasets for classification
    classification_datasets = [1, 2, 3]
    classification_dataset_ids = {}
    for dataset in classification_datasets:
        create_dataset = upload_dataset(dataset, classification_project_id)
        assert create_dataset.status_code == 200, create_dataset.content
        dataset_id = json.loads(create_dataset.content)["dataset_id"]
        print(
            f"Dataset {dataset} uploaded successfully to project {classification_project_id} with ID: {dataset_id}.")
        classification_dataset_ids[dataset] = dataset_id

    classification_dataset = classification_datasets[0]

    # generate classification ruleset for dataset 1
    response = generate_results(
        classification_dataset, classification_dataset_ids[
            classification_dataset], classification_algorithm_id
    )
    assert response.status_code == 201, response.content
    print(
        f"Generating classification ruleset and cross-validation for dataset {classification_dataset}...")

    # generate EDA report for first classification dataset
    response = generate_eda_report(
        classification_dataset_ids[classification_dataset], f"EDA report for dataset {classification_dataset}")
    assert response.status_code == 201, response.content
    print(
        f"Generating EDA report for dataset {classification_dataset}...")

    # generate predictive analysis reports for first classification dataset
    response = generate_prediction_report(
        classification_dataset_ids[classification_dataset],
        f"Prediction report for dataset {classification_dataset} - TT", "TT", "balanced_accuracy")
    assert response.status_code == 201, response.content
    print(
        f"Generating predictive analysis report (TT) for dataset {classification_dataset}...")
    response = generate_prediction_report(
        classification_dataset_ids[classification_dataset],
        f"Prediction report for dataset {classification_dataset} - CV", "CV", "roc_auc_ovo")
    assert response.status_code == 201, response.content
    print(
        f"Generating predictive analysis report (CV) for dataset {classification_dataset}...")

    # generate knowledge discovery report for first classification dataset
    response = generate_discovery_report(
        classification_dataset_ids[classification_dataset], "Whitebox report for dataset 1")
    assert response.status_code == 201, response.content
    print(
        f"Generating knowledge discovery report for dataset {classification_dataset}...")

    # upload classification rulesets
    for dataset in classification_datasets:
        dataset_id = classification_dataset_ids[dataset]
        create_ruleset = upload_ruleset(dataset, dataset_id)
        assert all(response.status_code == 201 for response in create_ruleset), \
            [response.content for response in create_ruleset]
        print(
            f"Successfully uploaded ruleset(s) for dataset {dataset} (ID: {dataset_id}).")

    # SECTION 3: Regression

    # create regression project
    project_body = load_json("jsons/regression_project.json")
    token = get_user_token()
    create_project = send_request(
        "api/projects", "post", token, data=project_body
    )
    assert create_project.status_code == 201, create_project.content
    print("Successfully created regression project.")
    regression_project_id = json.loads(create_project.content)["id"]

    # upload datasets for regression
    regression_datasets = [4]
    regression_dataset_ids = {}
    for dataset in regression_datasets:
        create_dataset = upload_dataset(dataset, regression_project_id)
        assert create_dataset.status_code == 200, create_dataset.content
        dataset_id = json.loads(create_dataset.content)["dataset_id"]
        print(
            f"Dataset {dataset} uploaded successfully to project {regression_project_id} with ID: {dataset_id}.")
        regression_dataset_ids[dataset] = dataset_id

    regression_dataset = regression_datasets[0]

    # generate regression ruleset for first regression dataset
    response = generate_results(
        regression_dataset, regression_dataset_ids[regression_dataset], regression_algorithm_id
    )
    assert response.status_code == 201, response.content
    print(
        f"Generating regression ruleset and cross-validation for dataset {regression_dataset}...")

    # generate EDA report for first regression dataset
    response = generate_eda_report(
        regression_dataset_ids[regression_dataset], f"EDA report for dataset {regression_dataset}")
    assert response.status_code == 201, response.content
    print(
        f"Generating EDA report for dataset {regression_dataset}...")

    # generate predictive analysis reports for first regression dataset
    response = generate_prediction_report(
        regression_dataset_ids[regression_dataset],
        f"Prediction report for dataset {regression_dataset} - TT", "TT", "r2")
    assert response.status_code == 201, response.content
    print(
        f"Generating predictive analysis report (TT) for dataset {regression_dataset}...")
    response = generate_prediction_report(
        regression_dataset_ids[regression_dataset],
        f"Prediction report for dataset {regression_dataset} - CV", "CV", "neg_mean_squared_error")
    assert response.status_code == 201, response.content
    print(
        f"Generating predictive analysis report (CV) for dataset {regression_dataset}...")

    # generate knowledge discovery report for first regression dataset
    response = generate_discovery_report(
        regression_dataset_ids[regression_dataset], f"Whitebox report for dataset {regression_dataset}")
    assert response.status_code == 201, response.content
    print(
        f"Generating knowledge discovery report for dataset {regression_dataset}...")

    # SECTION 4: Survival

    # create survival project
    project_body = load_json("jsons/survival_project.json")
    token = get_user_token()
    create_project = send_request(
        "api/projects", "post", token, data=project_body
    )
    assert create_project.status_code == 201, create_project.content
    print("Successfully created survival project.")
    survival_project_id = json.loads(create_project.content)["id"]

    # upload datasets for survival
    survival_datasets = [5]
    survival_dataset_ids = {}
    for dataset in survival_datasets:
        create_dataset = upload_dataset(dataset, survival_project_id)
        assert create_dataset.status_code == 200, create_dataset.content
        dataset_id = json.loads(create_dataset.content)["dataset_id"]
        print(
            f"Dataset {dataset} uploaded successfully to project {survival_project_id} with ID: {dataset_id}.")
        survival_dataset_ids[dataset] = dataset_id

    survival_dataset = survival_datasets[0]

    # generate survival ruleset for first survival dataset
    response = generate_results(
        survival_dataset, survival_dataset_ids[survival_dataset], survival_algorithm_id,
    )
    assert response.status_code == 201, response.content
    print(
        f"Generating survival ruleset and cross-validation for dataset {survival_dataset}...")

    # generate EDA report for first survival dataset
    response = generate_eda_report(
        survival_dataset_ids[survival_dataset], f"EDA report for dataset {survival_dataset}")
    assert response.status_code == 201, response.content
    print(
        f"Generating EDA report for dataset {survival_dataset}...")

    # generate predictive analysis report for first survival dataset
    response = generate_prediction_report(
        survival_dataset_ids[survival_dataset],
        f"Prediction report for dataset {survival_dataset} - TT", "TT", "c_index")
    assert response.status_code == 201, response.content
    print(
        f"Generating predictive analysis report (TT) for dataset {survival_dataset}...")
    response = generate_prediction_report(
        survival_dataset_ids[survival_dataset],
        f"Prediction report for dataset {survival_dataset} - CV", "CV", "c_index")
    assert response.status_code == 201, response.content
    print(
        f"Generating predictive analysis report (CV) for dataset {survival_dataset}...")

    # generate knowledge discovery report for first survival dataset
    response = generate_discovery_report(
        survival_dataset_ids[survival_dataset], f"Whitebox report for dataset {survival_dataset}")
    assert response.status_code == 201, response.content
    print(
        f"Generating knowledge discovery report for dataset {survival_dataset}...")

    # verify that all tasks finished successfully
    verify_script_success(
        [classification_project_id, regression_project_id, survival_project_id])


if __name__ == "__main__":
    populate()
