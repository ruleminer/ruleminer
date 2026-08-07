import json


class JSONSerializer:
    @staticmethod
    def serialize(element):
        return json.dumps(element, default=lambda o: o.__dict__)

    @staticmethod
    def deserialize(element):
        return json.loads(element)

    @staticmethod
    def prepare_request(element):
        return JSONSerializer.deserialize(JSONSerializer.serialize(element))
