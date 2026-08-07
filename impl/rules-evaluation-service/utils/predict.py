import numpy as np
import pandas as pd
from decision_rules.classification import ClassificationRuleSet
from decision_rules.classification.prediction_indicators import \
    calculate_for_classification
from decision_rules.core.ruleset import AbstractRuleSet
from decision_rules.regression import RegressionRuleSet
from decision_rules.regression.prediction_indicators import \
    calculate_for_regression
from decision_rules.survival.prediction_indicators import \
    calculate_for_survival
from fastapi import HTTPException
from serializers.request import PredictionConfig
from utils.clean import sanitize_data


def predict_with_model(
    model: AbstractRuleSet,
    prediction_config: PredictionConfig,
    coverage_matrix: np.ndarray = None,
    X: pd.DataFrame = None,
) -> np.ndarray:
    """Helper function to predict with model. It should be used instead of
    model.predict(X) and model.predict_using_coverage_matrix(coverage_matrix)
    methods. It ensures that prediction strategy is set correctly and fix empty
    ruleSet prediction problem present in decision rules package.

    Either coverage_matrix or X should be provided for this method to work.

    Args:
        model (AbstractRuleSet): ruleset
        prediction_config (PredictionConfig): prediction configuration
        coverage_matrix (np.ndarray, optional): coverage matrix. Defaults to None.
        X (pd.DataFrame, optional): X. Defaults to None.

    Raises:
        ValueError: If both coverage_matrix and X are None
        HTTPException: if prediction strategy is invalid

    Returns:
        np.ndarray: model prediction
    """
    if X is None and coverage_matrix is None:
        raise ValueError("Either coverage_matrix or X should be provided")

    _configure_prediction(model, prediction_config)

    # empty ruleSets prediction is not supported by decision rules
    if len(model.rules) == 0:
        return sanitize_data(np.full(
            shape=(X if X is not None else coverage_matrix).shape[0],
            fill_value=model.default_conclusion.value
        ))
    elif coverage_matrix is not None:
        return model.predict_using_coverage_matrix(coverage_matrix)
    else:
        return model.predict(X)


def _configure_prediction(model: AbstractRuleSet, prediction_config: PredictionConfig) -> None:
    # set prediction strategy
    try:
        model.set_prediction_strategy(prediction_config.prediction_strategy)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f'Invalid prediction strategy: "{prediction_config.prediction_strategy}"'
        ) from e
    # optionally enable/disable default rule
    model.set_default_conclusion_enabled(prediction_config.use_default_rule)


def calculate_model_prediction_indicators(
    model: AbstractRuleSet,
    prediction_config: PredictionConfig, X: np.ndarray, y: np.ndarray
) -> dict:
    """Calculates prediction indicators for the given model and dataset.

    Args:
        model (AbstractRuleSet): rule set
        prediction_config (PredictionConfig): prediction configuration
        X (np.ndarray): X
        y (np.ndarray): y

    Raises:
        ValueError: If model type is not supported

    Returns:
        dict: dictionary containing prediction indicators
    """
    y_pred = predict_with_model(
        model, X=X, prediction_config=prediction_config
    )
    if isinstance(model, ClassificationRuleSet):
        data: dict = calculate_for_classification(
            y, y_pred,
            calculate_only_for_covered_examples=True
        )
    elif isinstance(model, RegressionRuleSet):
        data: dict = calculate_for_regression(
            y, y_pred,
            calculate_only_for_covered_examples=True
        )
    else:
        data: dict = calculate_for_survival(
            model, X, y, y_pred,
            calculate_only_for_covered_examples=True
        )
    return data
