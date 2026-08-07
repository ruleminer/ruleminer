import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance
from sksurv.linear_model import CoxPHSurvivalAnalysis
from sksurv.metrics import integrated_brier_score


def feature_permutation_importance(model, X, y):
    """
    Calculate the permutation importance of the features for a given survival model.

    Args:
        model (type): The survival model object.
        X (pd.DataFrame): The input features.
        y (pd.Series): The structured array with target.

    Returns:
        pd.DataFrame: A DataFrame containing the permutation importance of the features.
    """
    result = permutation_importance(
        model, X.values, y, n_repeats=15, random_state=42)
    sorted_results = pd.DataFrame(
        {
            k: result[k]
            for k in (
                "importances_mean",
                "importances_std",
            )
        },
        index=X.columns,
    ).sort_values(by="importances_mean", ascending=False)

    return sorted_results[sorted_results["importances_mean"] != 0]


def score_C_index(model, X, y):
    """
    Calculate the C-index score for a given survival model.

    Args:
        model (object): The survival model object with a `score` and `predict_survival_function` method.
        X (array-like): The test set features.
        y (array-like): The target variable.

    Returns:
        float: The C-index score.
    """
    return model.score(X, y)


def score_Brier(model, X, y, y_test, time_col):
    """
    Calculate the integrated Brier score for a given survival model.

    Parameters:
        model (object): The survival model object with a `score` and `predict_survival_function` method.
        X (array-like): The test set features.
        y (array-like): The target variable.
        y_test (array-like): The test set target variable.
        time_col (str): The name of the column representing time to event.

    Returns:
        float: The integrated Brier score.
    """
    # Calculate the integrated Brier score
    lower, upper = np.percentile(y[time_col], [10, 90])
    times = np.arange(lower, upper)
    surv_prob = np.row_stack([
        fn(times)
        for fn in model.predict_survival_function(X)
    ])
    ibs = integrated_brier_score(y, y_test, surv_prob, times)
    return ibs


def score_features_CoxPH(X, y, alpha):
    """
    Calculate the C-index scores for each feature using CoxPHSurvivalAnalysis.

    Parameters:
        X (pandas.DataFrame): The input features.
        y (np.array): The structured array with target
        alpha (float): The regularization parameter.

    Returns:
        pandas.DataFrame: A DataFrame containing the C-index scores for each feature.
    """
    n_features = X.shape[1]
    scores = np.empty(n_features)
    m = CoxPHSurvivalAnalysis(alpha=alpha)
    for j in range(n_features):
        Xj = X.values[:, j: j + 1]
        m.fit(Xj, y)
        scores[j] = m.score(Xj, y)
    scores_numeric_features = pd.Series(
        scores, index=X.columns).sort_values(ascending=False)
    scores_numeric_features = pd.DataFrame(
        scores_numeric_features, columns=["C-index"])
    return scores_numeric_features
