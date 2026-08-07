import json

import psycopg2
from psycopg2.extras import RealDictCursor

db_params = {
    "database": "rolap",
    "user": "rolap",
    "password": "CHANGE_ME",
    "host": "localhost",
    "port": "5434"
}


output_path = "../example_project/classification"

# classification
project_id = 240
dataset_id = 325
ruleset_id = 309
# regrssion
# project_id = 241
# dataset_id = 326
# ruleset_id = 310
# survival
# project_id = 242
# dataset_id = 327
# ruleset_id = 312


queries = {
    "project": f"SELECT name, description, type_of_problem FROM api_project WHERE id = {project_id};",
    "dataset": f"SELECT name, description, delimiter, correlation_matrix, number_of_columns, number_of_rows, class_distribution, size FROM api_dataset WHERE id = {dataset_id};",
    "dataset_attributes": f"SELECT name, type, role, min, max, average, missing_values_count, mode, unique_values FROM api_datasetattributes WHERE dataset_id = {dataset_id};",
    "ruleset": f"SELECT name, description, generation_params, ruleset, rules_count, avg_conditions_count, avg_precision, avg_coverage, fraction_significant, \"fraction_FDR_significant\", total_conditions_count, type, generation_time, indicator_calculation_time FROM api_ruleset WHERE id = {ruleset_id};",
    "rules": f"SELECT uuid, description, p, n, \"P\", \"N\", train_covered_y_std, train_covered_y_mean, indicators, histogram, kaplan_meier_estimator FROM api_rules WHERE ruleset_id = {ruleset_id};",
    "prediction_results": f"SELECT results FROM api_predictionresults WHERE ruleset_id = {ruleset_id};",
    "importance_results": f"SELECT condition_importance, attribute_importance FROM api_importanceresults WHERE ruleset_id = {ruleset_id};"
}


def fetch_and_save_data(query, entity_name, cursor):
    cursor.execute(query)
    data = cursor.fetchall()
    if not data:
        data = []
    with open(f"{output_path}/{entity_name}.json", "w") as json_file:
        json.dump(data, json_file, indent=4)


def main():
    try:
        conn = psycopg2.connect(**db_params, cursor_factory=RealDictCursor)
        cursor = conn.cursor()

        for entity_name, query in queries.items():
            fetch_and_save_data(query, entity_name, cursor)

        print("Dane zostały pomyślnie zapisane.")

    except Exception as e:
        print(f"Wystąpił błąd: {e}")

    finally:
        if conn:
            cursor.close()
            conn.close()


if __name__ == "__main__":
    main()
