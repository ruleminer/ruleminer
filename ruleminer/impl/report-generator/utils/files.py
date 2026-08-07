import os
from uuid import uuid4


def create_file_name(report_type: str, dataset_id: int):
    """
    Create filename for the report.
    """
    return f"{report_type}-{dataset_id}-{str(uuid4())}.html"


def create_file_path(report_type: str, dataset_id: int):
    """
    Create directories for the report.
    """
    # create filename
    filename = create_file_name(report_type, dataset_id)
    db_path = os.path.join("reports", filename)

    return db_path
