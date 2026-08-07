import os

import pandas as pd


def read_dataset_from_resources(name: str) -> pd.DataFrame:
    current_file_path: str = os.path.dirname(os.path.realpath(__file__))
    return pd.read_csv(
        os.path.join(current_file_path, f'{name}.csv')
    )
