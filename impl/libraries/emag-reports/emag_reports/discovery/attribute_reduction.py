import matplotlib.pyplot as plt
from emag_reports.preprocess.encode_decode import encode_dataset


def feature_importance_xgboost(original_df, class_name, model_class):
    """
    Calculate and display feature importance using XGBoost.

    Args:
        original_df (pd.DataFrame): dataframe to be used for feature importance
        class_name (str): name of the class column
        model_class (type): XGBoost model class for which to calculate feature importance

    """
    df = original_df.copy()
    df, *_ = encode_dataset(df, class_name)
    X = df.drop(class_name, axis=1)
    y = df[class_name]

    model = model_class()
    model.fit(X.values, y)

    feature_importance = model.feature_importances_
    sorted_idx = feature_importance.argsort()
    top_n_features = 20
    plt.figure(figsize=(10, 8))
    top_features = X.columns[sorted_idx][-top_n_features:]
    top_importance = feature_importance[sorted_idx][-top_n_features:]
    plt.barh(top_features, top_importance)
    plt.xlabel("XGBoost feature importance")
    plt.show()
