from pydantic import BaseModel


class ReportGenerationResult(BaseModel):
    dataset_id: int
    storage_path: str
    type: str
    title: str
    generation_params: dict
    celery_task: int
