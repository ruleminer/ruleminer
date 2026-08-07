import numpy as np
import pandas as pd
from imblearn.metrics import geometric_mean_score
from IPython.display import display
from IPython.display import Markdown as md
from itables import show
from sklearn.metrics import balanced_accuracy_score
from sklearn.metrics import confusion_matrix
from sklearn.metrics import f1_score
from sklearn.metrics import max_error
from sklearn.metrics import mean_absolute_error
from sklearn.metrics import mean_absolute_percentage_error
from sklearn.metrics import mean_squared_error
from sklearn.metrics import r2_score
from sklearn.metrics import recall_score


def calculate_classification_indicators(y_true: list, y_pred: list, labels=None):
    """
    Calculate and display classification indicators.

    Args:
        y_true (list): list of true labels
        y_pred (list): list of predicted labels
        labels (list): list of label names
    """
    balanced_accuracy: float = balanced_accuracy_score(
        y_true=y_true, y_pred=y_pred)
    F1_macro: float = f1_score(y_true, y_pred, average='macro')
    F1_micro: float = f1_score(y_true, y_pred, average='micro')
    F1_weighted: float = f1_score(y_true, y_pred, average='weighted')
    G_mean_macro: float = geometric_mean_score(y_true, y_pred, average='macro')
    G_mean_micro: float = geometric_mean_score(y_true, y_pred, average='micro')
    G_mean_weighted: float = geometric_mean_score(
        y_true, y_pred, average='weighted')
    Recall_macro: float = recall_score(y_true, y_pred, average='macro')
    Recall_micro: float = recall_score(y_true, y_pred, average='micro')
    Recall_weighted: float = recall_score(y_true, y_pred, average='weighted')
    c_matrix: np.ndarray = confusion_matrix(y_true, y_pred)
    if labels is None:
        labels = sorted(set(y_true))

    indicators = {
        'Balanced Accuracy': [balanced_accuracy],
        'F1 Score (Macro)': [F1_macro],
        'F1 Score (Micro)': [F1_micro],
        'F1 Score (Weighted)': [F1_weighted],
        'Geometric Mean Score (Macro)': [G_mean_macro],
        'Geometric Mean Score (Micro)': [G_mean_micro],
        'Geometric Mean Score (Weighted)': [G_mean_weighted],
        'Recall (Macro)': [Recall_macro],
        'Recall (Micro)': [Recall_micro],
        'Recall (Weighted)': [Recall_weighted]
    }
    df_indicators = pd.DataFrame(indicators)
    display(md("#### Model performance:"))
    show(df_indicators)

    df_c_matrix = pd.DataFrame(c_matrix, index=labels, columns=labels)
    display(md("#### Confusion matrix:"))
    show(df_c_matrix)


def calculate_regression_indicators(y_true: list, y_pred: list):
    """
    Calculate and display regression indicators.

    Args:
        y_true (list): list of true values
        y_pred (list): list of predicted values
    """
    RMSE = np.sqrt(mean_squared_error(y_true, y_pred))
    MAE = mean_absolute_error(y_true, y_pred)
    MAPE = mean_absolute_percentage_error(y_true, y_pred)
    rRMSE = RMSE / np.mean(y_true)
    rMAE = MAE / np.mean(y_true)
    maxError = max_error(y_true, y_pred)
    R2 = r2_score(y_true, y_pred)

    indicators = {
        "RMSE": RMSE,
        "MAE": MAE,
        "MAPE": MAPE,
        "rRMSE": rRMSE,
        "rMAE": rMAE,
        "maxError": maxError,
        "R^2": R2
    }
    df_indicators = pd.DataFrame([indicators], index=['Values'])
    display(md("#### Model performance:"))
    show(df_indicators)


def calculate_stats(model):
    """
    Calculate and display stats of the rule model.

    Args:
        model: trained rule model

    Returns:
        pd.DataFrame: stats of the rule model
    """
    rules = model.ruleset_.rules
    number_of_rules = len(rules)
    total_conditions = 0
    for rule in rules:
        total_conditions += len(rule.conds)

    mean_rule_length = total_conditions / \
        number_of_rules if number_of_rules > 0 else 0
    stats_data = {
        'Statistic': ['Number of rules', 'Mean rule length', 'Total conditions'],
        'Value': [number_of_rules, mean_rule_length, total_conditions]
    }
    stats_df = pd.DataFrame(stats_data)
    return stats_df
