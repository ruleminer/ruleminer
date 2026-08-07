import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import OneHotEncoder


def encode_features(features_df: pd.DataFrame):
    """
    Encodes categorical features using OneHotEncoder.

    Args:
        features_df (pd.DataFrame): DataFrame with features to be encoded.

    Returns:
        pd.DataFrame: DataFrame with encoded features.
    """
    # Selecting categorical columns
    categorical_cols = features_df.select_dtypes(
        include=['object', 'category']).columns
    if len(categorical_cols) == 0:
        return features_df, None

    # One-Hot Encoding for categorical attributes
    encoder = OneHotEncoder(sparse_output=False)
    encoded_features = encoder.fit_transform(features_df[categorical_cols])

    # Conversion back to DataFrame with appropriate column names.
    encoded_features_df = pd.DataFrame(
        encoded_features, columns=encoder.get_feature_names_out(categorical_cols))
    encoded_features_df.index = features_df.index

    # Concatenating with numerical data
    numerical_cols = features_df.select_dtypes(include=['number']).columns
    encoded_features_df = pd.concat(
        [encoded_features_df, features_df[numerical_cols]], axis=1)

    return encoded_features_df, encoder


def encode_dataset(df, decision_attribute, encode_target=True):
    """
    Encodes the dataset using OneHotEncoder for categorical attributes and LabelEncoder for the target variable.

    Args:
        df (pd.DataFrame): DataFrame with the dataset.
        decision_attribute (str): Name of the target variable.
        encode_target (bool, optional): Whether to encode the target variable. Defaults to True.

    Returns:
        pd.DataFrame: DataFrame with encoded features.
        LabelEncoder: Encoder for the target variable.
        OneHotEncoder: Encoder for categorical attributes.
        list: List of categorical columns.
    """
    features_df = df.drop(decision_attribute, axis=1)
    target_series = df[decision_attribute]

    # Selecting categorical columns
    categorical_cols = features_df.select_dtypes(
        include=['object', 'category']).columns

    encoded_features_df, encoder = encode_features(features_df)

    if encode_target:
        # Label Encoding for the target variable.
        label_encoder = LabelEncoder()
        encoded_target = label_encoder.fit_transform(target_series)
    else:
        label_encoder = None
        encoded_target = target_series

    # Adding the encoded target variable to the DataFrame with features.
    encoded_features_df[target_series.name] = encoded_target

    return encoded_features_df, label_encoder, encoder, categorical_cols


def decode_dataset(encoded_df, original_df, onehot_encoder, target_column_name, categorical_cols, label_encoder=None):
    """
    Decodes the dataset using OneHotEncoder for categorical attributes and LabelEncoder for the target variable.

    Args:
        encoded_df (pd.DataFrame): DataFrame with the encoded dataset.
        original_df (pd.DataFrame): DataFrame with the original dataset.
        onehot_encoder (OneHotEncoder): Encoder for categorical attributes.
        target_column_name (str): Name of the target variable.
        categorical_cols (list): List of categorical columns.
        label_encoder (LabelEncoder, optional): Encoder for the target variable. Defaults to None.

    Returns:
        pd.DataFrame: DataFrame with decoded features.
    """
    # Selecting only columns that were encoded by OneHotEncoder
    feature_names = onehot_encoder.get_feature_names_out(
        categorical_cols) if onehot_encoder is not None else []
    encoded_features = encoded_df[feature_names]

    # Inverse transform the encoded features
    features = onehot_encoder.inverse_transform(
        encoded_features) if onehot_encoder is not None else pd.DataFrame()
    decoded_categorical_df = pd.DataFrame(
        features, columns=categorical_cols, index=encoded_df.index)

    # Add numerical columns back
    numerical_cols = original_df.select_dtypes(include=['number']).columns
    decoded_numerical_df = encoded_df[numerical_cols]

    # Concatenating categorical and numerical dataframes
    decoded_df = pd.concat(
        [decoded_categorical_df, decoded_numerical_df], axis=1)

    # Decoding target if label_encoder provided
    if label_encoder is not None:
        target = label_encoder.inverse_transform(
            encoded_df[target_column_name])
        decoded_df[target_column_name] = pd.Series(
            target, index=encoded_df.index)
    else:
        decoded_df[target_column_name] = encoded_df[target_column_name]

    return decoded_df
