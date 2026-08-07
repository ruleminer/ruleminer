from pydantic import BaseModel


class EDAReportRequest(BaseModel):
    DATASET_NAME: str
    TITLE: str

    @classmethod
    def from_params(cls, data):
        """Create instance from dict with conversion to upper case."""
        params = {}
        for key, value in data.items():
            params[key.upper()] = value
        return cls(**params)
