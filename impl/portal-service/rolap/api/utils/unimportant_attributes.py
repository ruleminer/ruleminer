import pandas as pd
IDNESS_THRESHOLD = 0.8
STABILITY_THRESHOLD = 0.8
MISSING_THRESHOLD = 0.8
TEXTNESS_THRESHOLD = 0.8


def calculate_idness(df: pd.DataFrame) -> pd.Series:
    non_numeric_df = df.select_dtypes(exclude=['number'])
    idness = non_numeric_df.nunique() / len(df)
    idness = idness.reindex(df.columns, fill_value=0)

    return idness


def calculate_stability(col: pd.Series) -> float:
    if col.dropna().empty:
        return 0
    most_frequent = col.mode()[0]
    return col.value_counts()[most_frequent] / col.notnull().sum()


def calculate_missing(df: pd.DataFrame) -> pd.Series:
    return df.isnull().sum() / len(df)


def calculate_textness(col: pd.Series, token_limiters=(' ', ',', ';', '.', ':', '\n', '\r', '-', '"', '\'', '(', ')')) -> float:
    if col.dtype != object:
        return 0
    text_lengths = col.dropna().apply(len)
    avg_text_length = text_lengths.mean() if not text_lengths.empty else 0
    token_limiter_count = sum(
        any(token in val for token in token_limiters) for val in col.dropna())
    unique_count = col.nunique()
    if unique_count > 0:
        return (token_limiter_count / unique_count + avg_text_length / 10) / 2
    return 0


def calculate_attribute_quality(df: pd.DataFrame, decision_attribute: str, token_limiters=(' ', ',', ';')) -> pd.DataFrame:
    df = df.drop(columns=[decision_attribute])
    quality_scores = pd.DataFrame(index=df.columns)

    quality_scores['ID-ness'] = calculate_idness(df)
    quality_scores['Missing'] = calculate_missing(df)
    quality_scores['Stability'] = df.apply(calculate_stability)
    quality_scores['Text-ness'] = df.apply(
        calculate_textness, token_limiters=token_limiters)

    return quality_scores


def determine_unimportant_attributes(df: pd.DataFrame, decision_attribute: str) -> dict:
    quality_scores: pd.DataFrame = calculate_attribute_quality(
        df, decision_attribute)
    low_quality_details = {}

    thresholds = pd.Series({
        'ID-ness': IDNESS_THRESHOLD,
        'Stability': STABILITY_THRESHOLD,
        'Missing': MISSING_THRESHOLD,
        'Text-ness': TEXTNESS_THRESHOLD
    })

    # Align quality_scores and thresholds before comparison
    quality_scores, thresholds = quality_scores.align(
        thresholds, axis=1, copy=False)

    comparison = quality_scores > thresholds

    for metric in thresholds.index:
        is_low_quality = comparison[metric]
        low_quality_columns = comparison.index[is_low_quality].tolist()
        if low_quality_columns:
            low_quality_details[metric] = low_quality_columns

    return low_quality_details
