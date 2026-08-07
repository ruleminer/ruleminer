from dataclasses import dataclass
from typing import Callable
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from emag_reports.models.prediction import PredictionSettings
from emag_reports.models.prediction import SurvivalScoring
from emag_reports.prediction.common import get_summary_feature_importance
from emag_reports.prediction.helpers import mean_summarize_table
from emag_reports.prediction.manager import PredictionManager
from IPython.display import display
from IPython.display import Markdown as md
from sklearn.model_selection import BaseCrossValidator
from sklearn.model_selection import GridSearchCV
from sksurv.metrics import as_concordance_index_ipcw_scorer
from sksurv.metrics import concordance_index_ipcw
from sksurv.metrics import cumulative_dynamic_auc
from sksurv.metrics import integrated_brier_score


@dataclass
class SurvivalPrediction:
    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: np.ndarray
    y_test: np.ndarray
    risk_scores: np.ndarray
    cum_auc_times: np.ndarray


class SurvivalManager(PredictionManager):
    """
    Survival prediction manager.

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
        class_attribute_time (str): name of the column representing time to the event
        class_attribute_event (str): name of the column representing event
        additional_method (Optional[Callable]): additional method to be called after model training
        ibs (bool): whether to calculate the integrated Brier score

    For more details, see documentation of the base class (PredictionManager).
    """
    scoring_dict = {
        SurvivalScoring.C_INDEX: as_concordance_index_ipcw_scorer,
    }

    def __init__(self,
                 model_class: type, model_name: str,
                 param_grid: dict, fixed_grid: dict,
                 grid_search: bool, scoring: SurvivalScoring,
                 mode: PredictionSettings.AnalysisMode,
                 X: pd.DataFrame, y: pd.Series, split: BaseCrossValidator,
                 original_features: np.ndarray,
                 class_attribute_time: str, class_attribute_event: str,
                 additional_method: Optional[Callable] = None,
                 ibs: bool = True):
        super().__init__(model_class, model_name, param_grid,
                         fixed_grid, grid_search, mode, scoring, X, y, split, original_features, additional_method)
        self.class_attribute_time = class_attribute_time
        self.class_attribute_event = class_attribute_event
        self.ibs = ibs
        self._predictions = []

    def generate_predictions(self):
        """
        Split the dataset, train models and generate predictions.
        """
        for train_index, test_index in self.split.split(self.x, self.y):
            X_train, X_test = self.x.iloc[train_index], self.x.iloc[test_index]
            y_train, y_test = self.y[train_index], self.y[test_index]
            model = self.model_class(**self.fixed_grid, **self.best_params)
            model.fit(X_train, y_train)
            model_risk_scores = model.predict(X_test)
            cum_auc_times = np.linspace(
                min(y_test[self.class_attribute_time]),
                max(y_test[self.class_attribute_time]),
                100,
                endpoint=False,
            )
            prediction = SurvivalPrediction(
                X_train, X_test, y_train, y_test, model_risk_scores, cum_auc_times
            )
            self._models.append(model)
            self._predictions.append(prediction)

    def perform_grid_search(self):
        """
        Perform grid search of hyperparameters.
        """
        if not self.grid_search or not self.param_grid:
            display(md("#### Training the model with default hyperparameters"))
            return
        self.display_param_grid()
        if self.param_grid:
            model = self.model_class(**self.fixed_grid)
            scorer = self.scoring_dict[self.scoring]
            model = scorer(model)
            params_grid_for_search = {
                f"estimator__{key}": value for key, value in self.param_grid.items()}
            grid_search = GridSearchCV(
                model, params_grid_for_search, cv=self.split)
            grid_search.fit(self.x, self.y)
            self.display_grid_search_results(grid_search)
            best_params = {
                key.split("__")[1]: value for key, value in grid_search.best_params_.items()}
        else:
            best_params = {}
        self._best_params = best_params

    def display_results(self):
        super().display_results()
        self._display_feature_importance()
        self.plot_auc()

    def summarize_model(self):
        results = []
        for model, prediction in zip(self._models, self._predictions):
            model_c_index, *_ = concordance_index_ipcw(
                survival_train=prediction.y_train,
                survival_test=prediction.y_test,
                estimate=prediction.risk_scores,
                tau=None,
            )
            if self.ibs:
                model_ibs = self._calculate_ibs(model, prediction)
            else:
                model_ibs = None
            result = pd.DataFrame({
                "C-index": [model_c_index],
                "IBS": [model_ibs],
            })
            results.append(result)
        return mean_summarize_table(results)

    def plot_auc(self):
        mean_auc_plot, mean_auc_std, auc_plots, mean_auc, std_auc = self._get_auc_data()
        display(md(f"### {self.model_name} time dependent AUC"))
        fig, ax = plt.subplots()
        fig.set_size_inches(12, 6)
        ax.plot(
            mean_auc_plot["time"],
            mean_auc_plot["AUC"],
            marker="o",
            color="blue",
            label="time-dependent AUC",
        )
        ax.axhline(mean_auc, linestyle="--", label="mean AUC", color="blue")
        if self.mode == PredictionSettings.AnalysisMode.CROSS_VALIDATION:
            auc_std_upper = mean_auc_plot["AUC"] + mean_auc_std["AUC"]
            auc_std_lower = np.maximum(
                mean_auc_plot["AUC"] - mean_auc_std["AUC"], 0)
            ax.fill_between(
                mean_auc_plot["time"],
                auc_std_lower,
                auc_std_upper,
                color="grey",
                alpha=0.2,
                label=r"time-dependent AUC $\pm$ 1 std. dev.",
            )
            ax.axhline(mean_auc + std_auc, linestyle="--",
                       color="red", label=r" mean AUC $\pm$ 1 std. dev.")
            ax.axhline(mean_auc - std_auc, linestyle="--", color="red")
        ax.set_xlabel("time $t$")
        ax.set_ylabel("AUC")
        ax.grid(True)
        plt.legend(loc="lower left")
        plt.show(fig)

    def plot_mean_auc(self, ax):
        mean_auc_plot, mean_auc_std, auc_plots, mean_auc, std_auc = self._get_auc_data()
        label = f"{self.model_name} (mean AUC = {mean_auc:.3f})"
        ax.plot(mean_auc_plot["time"], mean_auc_plot["AUC"], "o-", label=label)

    def _get_auc_data(self):
        aucs = []
        auc_plots = []
        times_for_cum_auc = np.linspace(
            min(self.y[self.class_attribute_time]),
            max(self.y[self.class_attribute_time]),
            100,
        )
        for model, prediction in zip(self._models, self._predictions):
            auc_plot, mean_auc = cumulative_dynamic_auc(
                prediction.y_train,
                prediction.y_test,
                prediction.risk_scores,
                prediction.cum_auc_times,
            )
            auc_plot = np.interp(
                times_for_cum_auc, prediction.cum_auc_times, auc_plot)
            aucs.append(mean_auc)
            auc_data = pd.DataFrame(
                {"time": times_for_cum_auc, "AUC": auc_plot})
            auc_plots.append(auc_data)
        mean_auc = np.mean(aucs)
        std_auc = np.std(aucs)
        mean_auc_plot = pd.concat(auc_plots).groupby(
            "time").mean().reset_index()
        mean_auc_std = pd.concat(auc_plots).groupby("time").std().reset_index()
        return mean_auc_plot, mean_auc_std, auc_plots, mean_auc, std_auc

    def _calculate_ibs(self, model, prediction):
        lower, upper = np.percentile(
            prediction.y_test[self.class_attribute_time], [10, 90])
        times = np.arange(lower, upper)
        surv_prob = np.row_stack([
            fn(times)
            for fn in model.predict_survival_function(prediction.X_test)
        ])
        ibs = integrated_brier_score(
            prediction.y_train, prediction.y_test, surv_prob, times)
        return ibs

    def _display_feature_importance(self):
        self._display_feature_importance_for(self._predictions, "train data")

    def _get_importance(self, model, prediction):
        importance = get_summary_feature_importance(
            model, prediction.X_train, prediction.y_train, prediction.X_train.columns, None)
        return importance
