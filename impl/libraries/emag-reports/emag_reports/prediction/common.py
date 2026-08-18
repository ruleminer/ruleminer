from dataclasses import dataclass
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from IPython.display import display
from IPython.display import Markdown as md
from sklearn.base import BaseEstimator
from sklearn.inspection import permutation_importance
from sklearn.tree import export_text
from sklearn.tree import plot_tree


@dataclass
class Prediction:
    X: pd.DataFrame
    y_true: pd.Series
    y_pred: np.ndarray
    y_prob: np.ndarray = None


def get_summary_feature_importance(
        model: BaseEstimator, x: pd.DataFrame, y: pd.Series, original_features: np.ndarray,
        scoring: Optional[str],
) -> pd.DataFrame:
    """
    Calculate permutation feature importance and summarize
    for original features (before one-hot encoding).

    Note: the summary algorithm, whereby absolute importance values of transformed features are summed up
    to get importance values for original features, is not currently used.

    Args:
        model (BaseEstimator): Trained model
        x (pd.DataFrame): Features.
        y (pd.Series): Target.
        original_features (np.ndarray): Original features.
        scoring (Optional[str]): Scoring method. Defaults to None.

    Returns:
        pd.DataFrame: summary feature importance.
    """
    raw_features = x.columns
    results = permutation_importance(model, x, y, scoring=scoring)
    if len(original_features) != len(raw_features):
        raw_importance = pd.DataFrame(
            results.importances_mean, index=raw_features).T
        importance = []
        for feature in original_features:
            feature_sum = raw_importance.filter(
                regex=f"^({feature}($|_).*)").iloc[0].abs().sum()
            importance.append(feature_sum)
    else:
        importance = results.importances_mean
    importance = pd.Series(importance, index=original_features)
    return pd.DataFrame(importance).T


def display_tree(model: BaseEstimator, features: np.ndarray, class_names: np.ndarray = None):
    """
    Display tree model.

    Args:
        model (BaseEstimator): a trained model
        features (np.ndarray): array of features
        class_names (np.ndarray): class names. Defaults to None.
    """
    """Display tree model."""
    display(md(f"#### Tree view:"))
    fig, ax = plt.subplots(figsize=(20, 20))
    if class_names is not None:
        class_names = [str(class_) for class_ in class_names]
    plot_tree(model, fontsize=10, feature_names=features,
              filled=True, class_names=class_names, ax=ax)
    plt.show(fig)


def print_tree(model: BaseEstimator, features: np.ndarray, class_names: np.ndarray = None):
    """
    Print tree model.

    Args:
        model (BaseEstimator): a trained model
        features (np.ndarray): array of features
        class_names (np.ndarray): class names. Defaults to None.
    """
    """Print tree model."""
    display(md(f"#### Tree structure:"))
    if class_names is not None:
        class_names = [str(class_) for class_ in class_names]
    text = export_text(
        model,
        feature_names=features,
        class_names=class_names,
    )
    print(text)
