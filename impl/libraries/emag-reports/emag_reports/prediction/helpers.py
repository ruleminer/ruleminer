import os

import pandas as pd


ROUND_DECIMAL_PLACES = int(os.environ["ROUND_DECIMAL_PLACES"])


def mean_summarize_one_row(data: list[pd.DataFrame], parameter: str = "mean") -> pd.DataFrame:
    """
    Summarize a list of dataframes and return a dataframe with mean and std. dev. of values.

    Args:
        data (list[pd.DataFrame]): list of dataframes.
        parameter (str): name of the parameter. Defaults to "mean".

    Returns:
        pd.DataFrame: dataframe with mean and std. dev. of values.
    """
    if len(data) == 1:
        data = data[0]
        data.index = [parameter]
        return data
    data = pd.concat(data)
    data = data.T
    data[parameter] = data.mean(axis=1)
    data["std. dev."] = data.std(axis=1)
    data = data[[parameter, "std. dev."]].T
    return data


def mean_summarize_table(data: list[pd.DataFrame]) -> pd.DataFrame:
    """
    Summarize a list of dataframes and return mean and std. dev. of values in them.

    Args:
        data (list[pd.DataFrame]): list of dataframes.

    Returns:
        pd.DataFrame: dataframe with mean and std. dev. of values.
    """
    if len(data) == 1:
        return data[0].round(ROUND_DECIMAL_PLACES).fillna("-")
    data = pd.concat(data)
    mean = data.groupby(data.index).mean().round(
        ROUND_DECIMAL_PLACES).astype(str)
    std = data.groupby(data.index).std().round(
        ROUND_DECIMAL_PLACES).astype(str)
    data = mean + " ± " + std
    data = data.replace("nan ± nan", "-")
    return data
