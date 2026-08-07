import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
from emag_reports.prediction.common import Prediction
from emag_reports.prediction.manager import PredictionManager
from IPython.display import display
from IPython.display import Markdown as md
from sklearn.metrics import mean_absolute_error
from sklearn.metrics import mean_squared_error
from sklearn.metrics import r2_score


class RegressionManager(PredictionManager):
    """
    Regression prediction manager.

    For more details, see documentation of the base class (PredictionManager).
    """
    display_names = ("MAE", "MSE", "RMSE", "R^2", )
    functions = (
        lambda prediction: mean_absolute_error(
            prediction.y_true, prediction.y_pred),
        lambda prediction: mean_squared_error(
            prediction.y_true, prediction.y_pred),
        lambda prediction: np.sqrt(mean_squared_error(
            prediction.y_true, prediction.y_pred)),
        lambda prediction: r2_score(prediction.y_true, prediction.y_pred),
    )

    def display_results(self):
        super().display_results()
        self._display_residual_plots()
        self._display_feature_importance()

    def _display_residual_plots(self):
        self._display_residual_plot_for(self._train_predictions, "train data")
        self._display_residual_plot_for(self._test_predictions, "test data")

    def _display_residual_plot_for(self, predictions: list[Prediction], set_name: str):
        """Create and display residual plots."""
        display(md(f"#### Residual plot ({set_name})"))
        y_true = np.concatenate(
            [prediction.y_true for prediction in predictions])
        y_pred = np.concatenate(
            [prediction.y_pred for prediction in predictions])
        errors = y_true - y_pred
        hist_data = np.histogram(errors, bins=30)
        fig, ax = plt.subplots(figsize=(6.4, 4.8))
        ax.bar(hist_data[1][:-1], hist_data[0],
               width=np.diff(hist_data[1]), color="blue")
        y_max = ax.get_ylim()[1] * 1.1
        ax.set_ylim(0, y_max)
        ax.set_ylabel("Frequency")
        ax.set_xlabel("Residual")
        ax.vlines(0, 0, y_max, color="grey", ls="--")
        plt.show(fig)

    def _display_shapley_values(self):
        self._display_shapley_values_for(self._train_predictions, "train data")
        self._display_shapley_values_for(self._test_predictions, "test data")

    def _display_shapley_values_for(self, predictions: list[Prediction], set_name: str):
        """Display Shapley values for a given set of models and features."""
        display(md(f"#### Shapley values [mean abs] ({set_name})"))
        shaps = []
        for model, prediction in zip(self.models, predictions):
            explainer = shap.Explainer(model)
            shap_values = explainer.shap_values(prediction.X)
            shap_values = np.absolute(shap_values).mean(0)
            shaps.append(shap_values)
        shaps = np.stack(shaps)
        mean_shaps = shaps.mean(0)
        std_shaps = shaps.std(0)
        shaps = pd.DataFrame(
            {"SHAP": mean_shaps, "STD": std_shaps}, index=self.x.columns)
        shaps = shaps.sort_values("SHAP", ascending=False).head(10)
        plot = plt.bar(shaps.index, shaps["SHAP"], yerr=shaps["STD"])
        plt.xticks(rotation=90)
        plt.show(plot)
