from pydantic import BaseModel


class AWSStorageConfig(BaseModel):
    endpoint_url: str
    aws_access_key_id: str
    aws_secret_access_key: str
