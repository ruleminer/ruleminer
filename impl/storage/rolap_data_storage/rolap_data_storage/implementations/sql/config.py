from pydantic import BaseModel


class DBStorageConfig(BaseModel):
    user: str
    password: str
    db_name: str
    host: str
    port: str

    def get_database_url(self):
        return f"postgresql+psycopg://{self.user}:{self.password}@{self.host}:{self.port}/{self.db_name}"
