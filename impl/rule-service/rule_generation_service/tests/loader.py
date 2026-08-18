import os

import pandas as pd


def load_dataset(name: str) -> pd.DataFrame:
    filename = f"{name}.csv"
    dir_path: str = os.path.dirname(os.path.realpath(__file__))
    file_path: str = os.path.join(dir_path, "datasets", filename)
    return pd.read_csv(file_path)
