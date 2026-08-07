import pandas as pd
from mlxtend.frequent_patterns import fpgrowth
from sklearn.preprocessing import OneHotEncoder


def find_frequent_itemsets_classification(df, target, exclude_target, min_cov, max_k, max_intervals):
    """
    Find frequent itemsets for classification tasks.

    Args:
        df (pd.DataFrame): dataset for which to find frequent itemsets
        target (str): target column name
        exclude_target (bool): whether to exclude the target column from the analysis
        min_cov (float): minimum coverage threshold
        max_k (int): maximum length of the itemsets
        max_intervals (int): maximum number of intervals for discretization

    Returns:
        pd.DataFrame: frequent itemsets
    """
    df = df.copy()

    for col in df.select_dtypes(include=['float']):
        df[col] = pd.cut(df[col], bins=max_intervals, duplicates='drop')

    if exclude_target:
        df = df.drop(columns=[target])

    encoder = OneHotEncoder(sparse_output=False)
    df_arr = df.to_numpy()
    encoded_features = encoder.fit_transform(df_arr)

    df_encoded = pd.DataFrame(
        encoded_features, columns=encoder.get_feature_names_out(df.columns)).astype(bool)
    df_encoded.index = df.index

    class_support = {}
    if not exclude_target:
        classes = df[target].unique()
        for cls in classes:
            df_class = df_encoded[df[target] == cls]
            frequent_itemsets_class = fpgrowth(
                df_class, min_support=min_cov, max_len=max_k, use_colnames=True)
            class_support[cls] = frequent_itemsets_class

    frequent_itemsets = fpgrowth(
        df_encoded, min_support=min_cov, max_len=max_k, use_colnames=True)

    for cls, support_data in class_support.items():
        support_col = f'percentage_support_class_{cls}'
        frequent_itemsets[support_col] = frequent_itemsets['itemsets'].apply(
            lambda x: support_data[support_data['itemsets'] == x]['support'].sum() if not support_data[
                support_data['itemsets'] == x].empty else 0
        )

    return frequent_itemsets


def find_frequent_itemsets_regression(df, target, exclude_target, min_cov, max_k, max_intervals):
    """
    Find frequent itemsets for regression tasks.

    Args:
        df (pd.DataFrame): dataset for which to find frequent itemsets
        target (str): target column name
        exclude_target (bool): whether to exclude the target column from the analysis
        min_cov (float): minimum coverage threshold
        max_k (int): maximum length of the itemsets
        max_intervals (int): maximum number of intervals for discretization

    Returns:
        pd.DataFrame: frequent itemsets
    """
    df = df.copy()

    # Discretization of continuous variables.
    for col in df.select_dtypes(include=['float', 'int']):
        df[col] = pd.cut(df[col], bins=max_intervals, duplicates='drop')

    # Optional disabling of the decision column.
    if exclude_target:
        df = df.drop(columns=[target])

    # One-Hot Encoding for itemset analysis
    encoder = OneHotEncoder(sparse_output=False)
    encoded_features = encoder.fit_transform(df)
    df_encoded = pd.DataFrame(
        encoded_features, columns=encoder.get_feature_names_out(df.columns)).astype(bool)

    # Searching for frequent itemsets
    frequent_itemsets = fpgrowth(
        df_encoded, min_support=min_cov, max_len=max_k, use_colnames=True)

    return frequent_itemsets


def find_frequent_itemsets_survival(df, event_col, time_col, exclude_target, min_cov, max_k, max_intervals):
    """
    Find frequent itemsets for survival tasks.

    Args:
        df (pd.DataFrame): dataset for which to find frequent itemsets
        event_col (str): event column name
        time_col (str): time column name
        exclude_target (bool): whether to exclude target columns from the analysis
        min_cov (float): minimum coverage threshold
        max_k (int): maximum length of the itemsets
        max_intervals (int): maximum number of intervals for discretization

    Returns:
        pd.DataFrame: frequent itemsets
    """
    df = df.copy()

    for col in df.select_dtypes(include=['float', 'int']):
        df[col] = pd.cut(df[col], bins=max_intervals, duplicates='drop')

    if exclude_target:
        df = df.drop(columns=[event_col, time_col])

    # One-Hot Encoding for itemset analysis
    encoder = OneHotEncoder(sparse_output=False)
    encoded_features = encoder.fit_transform(df)
    df_encoded = pd.DataFrame(
        encoded_features, columns=encoder.get_feature_names_out(df.columns)).astype(bool)

    frequent_itemsets = fpgrowth(
        df_encoded, min_support=min_cov, max_len=max_k, use_colnames=True)

    return frequent_itemsets
