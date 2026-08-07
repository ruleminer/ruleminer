from typing import Callable
from typing import Optional
from warnings import filterwarnings

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from emag_reports.logger import logger
from emag_reports.models.prediction import PredictionSettings
from emag_reports.prediction.common import get_summary_feature_importance
from emag_reports.prediction.common import Prediction
from emag_reports.prediction.helpers import mean_summarize_one_row
from emag_reports.prediction.helpers import mean_summarize_table
from emag_reports.prediction.helpers import ROUND_DECIMAL_PLACES
from IPython.display import display
from IPython.display import Markdown as md
from itables import show
from sklearn.base import BaseEstimator
from sklearn.exceptions import ConvergenceWarning
from sklearn.exceptions import UndefinedMetricWarning
from sklearn.model_selection import BaseCrossValidator
from sklearn.model_selection import GridSearchCV

_ = plt.ioff()
# Ignore warnings; in the future, we may want to handle them in a way that display a message to the user
filterwarnings("ignore", category=ConvergenceWarning)
filterwarnings("ignore", category=UndefinedMetricWarning)
filterwarnings("ignore", category=RuntimeWarning)


class PredictionManager:
    """
    Base class for training and displaying results of prediction models.

    Args:
        model_class (type): machine learning model class which provides a training and prediction API, e.g. as in scikit-learn
        model_name (str): human-readable name of the model
        param_grid (dict): grid of hyperparameters to be searched
        fixed_grid (dict): fixed non-default parameters to be passed to the model independent of grid search
        grid_search (bool): whether to perform grid search of hyperparameters
        mode (PredictionSettings.AnalysisMode): train-test or cross-validation
        scoring (str): metric to be optimized during grid search
        X (pd.DataFrame): dataframe of independent variables
        y (pd.Series): series containing the dependent variable
        split (BaseCrossValidator): `scikit-learn` `BaseCrossValidator`-type object which splits the dataset
        original_features (np.ndarray): original features used in the model
        additional_method (Optional[Callable]): additional method to be called after model training

    Class attributes:
    - `display_names`: names of the performance metrics to be calculated and displayed in summary
    - `functions`: corresponding functions to calculate the performance metrics
    - `round`: number of decimal places to round the summary statistics
    """
    display_names = ()
    functions = ()
    round = ROUND_DECIMAL_PLACES

    def __init__(self,
                 model_class: type, model_name: str,
                 param_grid: dict, fixed_grid: dict,
                 grid_search: bool, mode: PredictionSettings.AnalysisMode,
                 scoring: str,
                 X: pd.DataFrame, y: pd.Series, split: BaseCrossValidator,
                 original_features: np.ndarray,
                 additional_method: Optional[Callable] = None):
        self.model_class: type = model_class
        self._models: list[BaseEstimator] = []
        self.model_name: str = model_name
        self.param_grid: dict = param_grid
        self.fixed_grid: dict = fixed_grid
        self.grid_search: bool = grid_search
        self.scoring: str = scoring
        self.x: pd.DataFrame = X
        self.y: pd.Series = y
        self._train_predictions: list[Prediction] = []
        self._test_predictions: list[Prediction] = []
        self.split: BaseCrossValidator = split
        self._best_params: Optional[dict] = None
        self.mode: PredictionSettings.AnalysisMode = mode
        self.original_features: np.ndarray = original_features
        self.additional_method = additional_method
        self.trained = False
        display(md(f"## {model_name}"))

    def run(self):
        """
        Run the prediction analysis.
        """
        try:
            self.perform_grid_search()
            self.generate_predictions()
            if self.additional_method is not None:
                self.additional_method(self.model)
            self.display_results()
            self.trained = True
        except Exception as e:
            logger.exception(e)
            display(md(f"Training of {self.model_name} model failed."))

    def generate_predictions(self):
        """
        Split the dataset, train models and generate predictions.
        """
        for train_index, test_index in self.split.split(self.x, self.y):
            X_train, X_test = self.x.iloc[train_index], self.x.iloc[test_index]
            y_train, y_test = self.y.iloc[train_index], self.y.iloc[test_index]
            model = self.model_class(**self.fixed_grid, **self.best_params)
            model.fit(X_train, y_train)
            self._models.append(model)
            self._train_predictions.append(
                Prediction(X_train, y_train, model.predict(X_train))
            )
            self._test_predictions.append(
                Prediction(X_test, y_test, model.predict(X_test))
            )
        if self.grid_search:
            display(md("### Best model characteristics:"))

    def display_param_grid(self):
        """
        Display the hyperparameter space to be explored.
        """
        display(md("#### Explored hyperparameter space:"))
        for param in self.param_grid:
            display(md(f"`{param}`: {self.param_grid[param]}"))
        display(md(f"Optimization score: `{self.scoring}`"))

    def perform_grid_search(self):
        """
        Perform grid search of hyperparameters.
        """
        if not self.grid_search or not self.param_grid:
            display(md("#### The model was trained with default hyperparameters."))
            return
        self.display_param_grid()
        if self.param_grid:
            model = self.model_class(**self.fixed_grid)
            grid_search = GridSearchCV(
                model, self.param_grid, cv=self.split, scoring=self.scoring)
            grid_search.fit(self.x, self.y)
            self.display_grid_search_results(grid_search)
            best_params = grid_search.best_params_
        else:
            best_params = {}
        self._best_params = best_params

    def display_grid_search_results(self, grid_search: GridSearchCV):
        """
        Display the results of grid search.
        """
        # Display top 5 results
        display(md("#### Explored models"))
        results = pd.DataFrame(grid_search.cv_results_["params"])
        test_score_column = "mean test score" if self.mode == PredictionSettings.AnalysisMode.CROSS_VALIDATION else "test score"
        fit_time_column = "mean fit time (s)" if self.mode == PredictionSettings.AnalysisMode.CROSS_VALIDATION else "fit time (s)"
        prediction_time_column = "mean prediction time (s)" if self.mode == PredictionSettings.AnalysisMode.CROSS_VALIDATION else "prediction time (s)"
        results = pd.concat(
            [
                results,
                pd.DataFrame(
                    grid_search.cv_results_["mean_test_score"],
                    columns=[test_score_column]
                ),
                pd.DataFrame(
                    grid_search.cv_results_["std_test_score"],
                    columns=["test score std."]
                ) if self.mode == PredictionSettings.AnalysisMode.CROSS_VALIDATION else pd.DataFrame(),
                pd.DataFrame(
                    grid_search.cv_results_["mean_fit_time"],
                    columns=[fit_time_column]
                ),
                pd.DataFrame(
                    grid_search.cv_results_["mean_score_time"],
                    columns=[prediction_time_column]
                ),
            ],
            axis=1,
        ).sort_values(by=test_score_column, ascending=False).reset_index(drop=True)
        results = results.fillna("None")
        show(results.round(self.round))

    def summarize_model(self):
        """
        Generate summary statistic of the trained model(s).
        :return:
        """
        results = []
        for prediction in self._test_predictions:
            result = {
                name: [function(prediction)]
                for name, function in zip(self.display_names, self.functions)
            }
            results.append(pd.DataFrame(result))
        return mean_summarize_table(results)

    def display_results(self):
        """
        Display the results model training and predictions.
        """
        if self.grid_search and self.best_params:
            display(md("#### Parameters"))
            params = pd.DataFrame(self.best_params, index=[0])
            show(params, showIndex=False)
        display(md("#### Model performance on test data"))
        summary = self.summarize_model().round(self.round).fillna("-")
        show(summary, showIndex=False)

    def display_summary_graphs(self):
        """
        Display graphs summarizing model performance.
        """

    @property
    def models(self) -> list[BaseEstimator]:
        if not self._models:
            raise ValueError("Model has not been trained yet")
        return self._models

    @property
    def best_params(self) -> dict:
        if self._best_params is None:
            return {}
        return self._best_params

    @property
    def model(self):
        if self.mode == PredictionSettings.AnalysisMode.TRAIN_TEST:
            return self.models[0]
        else:
            display(
                md("##### In cross-validation mode, characteristics below as trained for the entire dataset"))
            model = self.model_class(**self.fixed_grid, **self.best_params)
            model.fit(self.x, self.y)
            return model

    def _display_feature_importance(self):
        self._display_feature_importance_for(
            self._train_predictions, "train data")
        self._display_feature_importance_for(
            self._test_predictions, "test data")

    def _display_feature_importance_for(self, predictions: list[Prediction], set_name: str):
        """Display feature importance for a given set of predictions."""
        display(md(f"#### Feature importance ({set_name})"))
        importances = []
        for model, prediction in zip(self.models, predictions):
            importance = self._get_importance(model, prediction)
            importances.append(importance)
        df = mean_summarize_one_row(importances, "importance").T
        df = df.sort_values("importance", ascending=False)
        if len(df) > 20:
            df = df.head(20)
        yerr = df["std. dev."] if "std. dev." in df else None
        plot, ax = plt.subplots()
        ax.bar(df.index, df["importance"], yerr=yerr, color="blue")
        ax.xaxis.set_ticks(df.index)
        ax.xaxis.set_ticklabels(df.index, rotation=90)
        ax.set_ylabel("feature importance")
        plt.show(plot)

    def _get_importance(self, model, prediction):
        return get_summary_feature_importance(
            model, prediction.X, prediction.y_true, prediction.X.columns, self.scoring)

    def __repr__(self):
        return f"<{type(self).__name__} for {self.model_name}>"
