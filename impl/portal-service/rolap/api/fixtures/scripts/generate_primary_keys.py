"""Script processing fixtures files and autogenerating primary keys for entities
"""
import argparse
import json
from collections import defaultdict
from typing import Any
from typing import TypedDict

JSON_INDENT: int = 2


class Entity(TypedDict):
    model: str
    pk: int
    fields: dict[str, Any]


def autogenerate_primary_keys(fixture_path: str):
    with open(fixture_path, encoding="utf-8") as f:
        entities: list[Entity] = json.load(f)

    model_pk_counter: dict[str, int] = defaultdict(lambda: 1)
    for entity in entities:
        model_type: str = entity["model"]
        entity["pk"] = model_pk_counter[model_type]
        model_pk_counter[model_type] += 1

    with open(fixture_path, "w", encoding="utf-8") as f:
        json.dump(entities, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=(
            'Script processing fixtures files and autogenerating primary keys for '
            'entities.\n For each model type it assigns primary keys starting from 1.'
        ))
    parser.add_argument(
        'fixture_path',
        type=str,
        help='Path to the fixture file'
    )
    args = parser.parse_args()
    autogenerate_primary_keys(args.fixture_path)
