import numpy as np
import pandas as pd
from emag_reports.preprocess.encode_decode import encode_features
from imblearn.over_sampling import SMOTE
from IPython.display import display
from IPython.display import Markdown as md
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import StandardScaler
from sksurv.util import Surv


def remove_low_correlation_attributes(df, decision_attribute):
    """
    Remove attributes from the dataset based on their correlation with the decision attribute (for classification only if decision attribute is binary).
    Args:
        df (pd.DataFrame): The input dataframe.
        decision_attribute (str): The name of the decision attribute which is used to assess correlation.

    Returns:
        pd.DataFrame: The dataframe with attributes having low correlation removed.
        dict: A dictionary detailing which attributes were removed due to low correlation.
    """
    details = {}
    df_encoded = df.copy()

    # Check if the decision attribute is categorical and binary
    if df[decision_attribute].dtype == 'object' and df[decision_attribute].nunique() == 2:
        check_correlation = True
    elif df[decision_attribute].dtype != 'object':
        check_correlation = True
    else:
        check_correlation = False  # Do not check for non-binary categorical attributes

    if check_correlation:
        # Select only numeric columns (excluding the decision attribute column)
        numeric_cols = df.select_dtypes(include='number').columns.tolist()
        df_encoded = df.copy()
        if decision_attribute in numeric_cols:
            numeric_cols.remove(decision_attribute)
        else:
            le = LabelEncoder()
            df_encoded[decision_attribute] = le.fit_transform(
                df_encoded[decision_attribute])
        # Calculate the absolute correlation matrix for numeric columns and the decision attribute
        corr_matrix = df_encoded[numeric_cols +
                                 [decision_attribute]].corr().abs()
        irrelevant_numeric_features = corr_matrix[corr_matrix[decision_attribute] <= 0.2].index
        details['Removed due to low correlation with the decision attribute'] = irrelevant_numeric_features
        df = df.drop(columns=irrelevant_numeric_features, axis=1)

    return df, details


def calculate_attribute_quality(df, decision_attribute, token_limiters=(' ', ',', ';')):
    """
    Calculate the quality of attributes in the dataset.

    Args:
        df (pd.DataFrame): The input dataframe.
        decision_attribute (str): The name of the decision attribute.
        token_limiters (tuple): A tuple containing the token limiters.

    Returns:
        dict: A dictionary containing the quality scores for each attribute.
    """
    quality_scores = {}

    total_rows = len(df)
    for col in df.columns:
        if col == decision_attribute or col in decision_attribute:
            continue

        # ID-ness - only for nominal columns
        idness = 0
        if df[col].dtype == object:
            idness = df[col].nunique() / total_rows

        # Stability
        if df[col].dropna().empty:
            stability = 0
        else:
            most_frequent = df[col].mode()[0]
            stability = df[col].value_counts()[most_frequent] / \
                df[col].notnull().sum()

        # Missing
        missing = df[col].isnull().sum() / total_rows

        # Text-ness
        textness = 0
        if df[col].dtype == object:
            text_lengths = df[col].dropna().apply(len)
            avg_text_length = text_lengths.mean() if not text_lengths.empty else 0
            token_limiter_count = sum(
                any(token in val for token in token_limiters) for val in df[col].dropna())
            textness = (token_limiter_count /
                        df[col].nunique() + avg_text_length / 10) / 2

        quality_scores[col] = {'I': idness,
                               'S': stability, 'M': missing, 'T': textness}

    return quality_scores


def remove_low_quality_attributes(df, decision_attribute, thresholds):
    """
    Remove low-quality attributes from the dataset based on the specified thresholds.

    Args:
        df (pd.DataFrame): The input dataframe.
        decision_attribute (str): The name of the decision attribute.
        thresholds (dict): A dictionary containing the thresholds for each quality metric.

    Returns:
        pd.DataFrame: The dataframe with low-quality attributes removed.
    """
    quality_scores = calculate_attribute_quality(df, decision_attribute)
    cols_to_drop = []
    low_quality_details = []

    for col, scores in quality_scores.items():
        if any(scores[metric] > thresholds[metric] for metric in thresholds):
            cols_to_drop.append(col)
            reasons = [
                metric for metric, threshold in thresholds.items() if scores[metric] > threshold
            ]
            reasons = [metric.capitalize().replace('I', 'Excessive number of unique values').replace('S', 'Stability').replace(
                'M', 'Missing values').replace('T', 'Text-like - the variable values resemble text') for metric in reasons]
            reasons_str = ', '.join(reasons)
            low_quality_details.append(f"{col} ({reasons_str})")

    df = df.drop(cols_to_drop, axis=1)
    return df, {'Removed due to low quality': low_quality_details}


def impute_missing_values(df, target_column, strategy_numerical='mean', strategy_nominal='most_frequent'):
    """
    Impute missing values in the dataset using the specified strategies.

    Args:
        df (pd.DataFrame): The input dataframe.
        target_column (str or list): The name of the target column or a list of target columns.
        strategy_numerical (str): The imputation strategy for numerical columns.
        strategy_nominal (str): The imputation strategy for nominal columns.

    Returns:
        pd.DataFrame: The dataframe with missing values imputed.
    """
    if isinstance(target_column, list):
        df = df.dropna(subset=target_column)
    else:
        df = df.dropna(subset=[target_column])
    index = df.index

    # leave out target columns from imputation (we already dropped rows with missing values in target columns)
    target_df = df[target_column]
    df = df.drop(columns=target_column)

    # change bool columns to object for imputing
    bool_cols = df.select_dtypes(include=['bool']).columns
    df[bool_cols] = df[bool_cols].astype('object')

    numerical_cols = df.select_dtypes(include=['number']).columns
    nominal_cols = df.select_dtypes(exclude=['number']).columns

    df_imputed_parts = []

    if len(numerical_cols) > 0:
        imputer_numerical = SimpleImputer(strategy=strategy_numerical)
        df_numerical = pd.DataFrame(imputer_numerical.fit_transform(
            df[numerical_cols]), columns=numerical_cols)
        df_imputed_parts.append(df_numerical)

    if len(nominal_cols) > 0:
        imputer_nominal = SimpleImputer(strategy=strategy_nominal)
        df_nominal = pd.DataFrame(imputer_nominal.fit_transform(
            df[nominal_cols]), columns=nominal_cols)
        df_imputed_parts.append(df_nominal)

    if df_imputed_parts:
        df_imputed = pd.concat(df_imputed_parts, axis=1)
        df_imputed.index = index
    else:
        df_imputed = df

    # change bool columns back to bool
    df_imputed[bool_cols] = df_imputed[bool_cols].astype('bool')

    # add target columns back
    df_imputed = pd.concat([df_imputed, target_df], axis=1)

    return df_imputed


def balance_decision_classes(df, target):
    """
    Balances the decision classes in the dataset (classification) using the SMOTE algorithm.

    Args:
        df (pd.DataFrame): The input dataframe.
        target (str): The name of the target column.

    Returns:
        pd.DataFrame: The dataframe with balanced decision classes.
    """
    # get the count of observations for the most underrepresented class
    class_counts = df[target].value_counts()
    minimal_class_count = class_counts.min()
    # Check if balancing is possible
    if minimal_class_count > 1:
        # Apply SMOTE with valid k_neighbors
        smote = SMOTE(k_neighbors=minimal_class_count - 1)
        X, y = df.drop(target, axis=1), df[target]
        X_res, y_res = smote.fit_resample(X, y)
        df_res = pd.concat([pd.DataFrame(X_res, columns=X.columns),
                            pd.DataFrame(y_res, columns=[target])], axis=1)
        return df_res, True
    else:
        display(md("#### Balancing of decision classes is not possible with the current dataset (need at least 2 samples per class)."))
        return df, False


def show_status(status: bool) -> str:
    return "YES" if status else "NO"


def remove_uncensored_at_max_times(y, X):
    """
    Removes uncensored cases at the highest survival times from the dataset.

    Parameters:
        y (numpy.ndarray): Target variable array, structured as Surv object.
        X (pandas.DataFrame): dataset

    Returns:
        numpy.ndarray, pandas.DataFrame: The modified y and X.
    """
    survival_time = y.dtype.names[1]
    survival_status = y.dtype.names[0]

    unique_times = np.unique(
        y[survival_time])
    for time in sorted(unique_times, reverse=True):
        uncensored_indices = (y[survival_time] == time) & (
            y[survival_status] == False)
        # Remove all uncensored cases at this time
        y = y[~uncensored_indices]
        X = X.loc[~uncensored_indices]

        # Check if there are any remaining cases at this time
        remaining_cases_at_time = (y[survival_time] == time)
        if not np.any(remaining_cases_at_time):
            continue
        else:
            break
    return y, X


def preprocess_survival_data(df, target_event, target_time):
    """
    Preprocesses survival data by performing the following steps:
    1. Drops the target_event and target_time columns from the input dataframe.
    2. Converts the target_event and target_time columns into a Surv object.
    3. Encodes the remaining features using one-hot encoding.
    4. Standardizes the encoded features.

    Parameters:
        df (pandas.DataFrame): The input dataframe containing the survival data.
        target_event (str): The name of the column representing the event of interest.
        target_time (str): The name of the column representing the survival time.

    Returns:
        tuple: A tuple containing the following preprocessed data:
            - X_encoded (pandas.DataFrame): The encoded features.
            - X_standardized (pandas.DataFrame): The standardized features.
            - X (pandas.DataFrame): The original dataframe without the target columns.
            - y (numpy.ndarray): The target variable represented as a Surv object.
    """
    X = df.drop([target_event, target_time], axis=1)
    y = Surv.from_dataframe(target_event, target_time, df)

    y, X = remove_uncensored_at_max_times(
        y, X)

    X_encoded, _ = encode_features(X)
    scaler = StandardScaler()
    X_standardized = pd.DataFrame(scaler.fit_transform(
        X_encoded), columns=X_encoded.columns, index=X.index)
    return X_encoded, X_standardized, X, y
