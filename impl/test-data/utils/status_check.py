import sys
from time import sleep

from utils.methods import get_user_token
from utils.methods import send_request


def verify_script_success(projects: list[int]):
    print("Waiting for all tasks to finish...")
    while True:
        all_statuses = []
        for project_id in projects:
            token = get_user_token()
            response = send_request(
                f"api/tasks/project/{project_id}",
                "get", token,
            )
            tasks = response.json()["results"]
            statuses = [task["status"] for task in tasks]
            all_statuses.extend(statuses)
        if "FAILURE" in all_statuses:
            print("Some of the tasks did not finish successfully!")
            sys.exit(1)
        all_statuses = set(all_statuses)
        if len(all_statuses) == 1 and "SUCCESS" in all_statuses:
            print("All tasks finished successfully! Database successfully populated.")
            sys.exit(0)
        sleep(30)
