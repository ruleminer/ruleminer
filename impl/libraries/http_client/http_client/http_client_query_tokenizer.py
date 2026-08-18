class QueryTokenizer:
    query_params: dict = None

    def __init__(self, query_params: dict = {}):
        self.query_params = query_params

    def add_query_param(self, key: str, value: str):
        self.query_params[key] = value
        return self

    def remove_query_param(self, key: str):
        self.query_params.pop(key, None)
        return self

    def get_query_params(self):
        return self.query_params

    def get_query_string(self):
        formatted_params = []
        for key, value in self.query_params.items():
            formatted_param = f"{key}={value}"
            formatted_params.append(formatted_param)
        return "?" + "&".join(formatted_params)
