from typing import Callable
from typing import Optional

import numpy as np
import pandas as pd
import shap
from emag_reports.models.prediction import ClassificationScoring
from emag_reports.models.prediction import PredictionSettings
from emag_reports.prediction.common import Prediction
from emag_reports.prediction.helpers import mean_summarize_table
from emag_reports.prediction.manager import PredictionManager
from IPython.core.display import Markdown as md
from IPython.core.display_functions import display
from itables import show
from matplotlib import pyplot as plt
from sklearn.metrics import auc
from sklearn.metrics import balanced_accuracy_score
from sklearn.metrics import classification_report
from sklearn.metrics import confusion_matrix
from sklearn.metrics import f1_score
from sklearn.metrics import precision_score
from sklearn.metrics import recall_score
from sklearn.metrics import roc_auc_score
from sklearn.metrics import roc_curve
from sklearn.model_selection import BaseCrossValidator


class ClassificationManager(PredictionManager):
    """
    Classification prediction manager.

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
        class_names (np.ndarray): names of classes in the dependent variable
        binary (bool): whether the dependent variable is binary

    For more details, see documentation of the base class (PredictionManager).
    """
    display_names = ("Balanced accuracy", "Precision",
                     "Recall", "F1 score", "ROC AUC", )
    functions = (
        lambda prediction: balanced_accuracy_score(
            prediction.y_true, prediction.y_pred),
        lambda prediction: precision_score(
            prediction.y_true, prediction.y_pred, average="weighted"),
        lambda prediction: recall_score(
            prediction.y_true, prediction.y_pred, average="weighted"),
        lambda prediction: f1_score(
            prediction.y_true, prediction.y_pred, average="weighted"),
        lambda prediction: roc_auc_score(
            prediction.y_true, prediction.y_prob, average="weighted", multi_class="ovo"),
    )

    def __init__(self,
                 model_class: type, model_name: str,
                 param_grid: dict, fixed_grid: dict,
                 grid_search: bool, mode: PredictionSettings.AnalysisMode,
                 scoring: ClassificationScoring,
                 X: pd.DataFrame, y: pd.Series, split: BaseCrossValidator,
                 original_features: np.ndarray,
                 class_names: np.ndarray, additional_method: Optional[Callable] = None, binary=False):
        self.class_names = class_names
        self.binary = binary
        super().__init__(
            model_class, model_name, param_grid, fixed_grid, grid_search, mode, scoring, X, y, split, original_features, additional_method)

    def generate_predictions(self):
        super().generate_predictions()
        # add probabilities to classification predictions
        for model, prediction in zip(self.models, self._train_predictions):
            train_prob = model.predict_proba(prediction.X)
            if self.binary:
                train_prob = train_prob[:, 1]
            prediction.y_prob = train_prob
        for model, prediction in zip(self.models, self._test_predictions):
            test_prob = model.predict_proba(prediction.X)
            if self.binary:
                test_prob = test_prob[:, 1]
            prediction.y_prob = test_prob

    def display_results(self):
        super().display_results()
        self._display_classification_reports()
        self._display_feature_importance()

    def _display_classification_reports(self):
        self._display_classification_report_for(
            self._train_predictions, "train data")
        if self.binary:
            self._display_confusion_matrix_for(
                self._train_predictions, "train data")
        self._display_classification_report_for(
            self._test_predictions, "test data")
        if self.binary:
            self._display_confusion_matrix_for(
                self._test_predictions, "test data")

    def _display_classification_report_for(self, predictions: list[Prediction], set_name: str):
        """Display classification report for a given set of predictions."""
        display(md(f"#### Prediction report ({set_name})"))
        reports = []
        for prediction in predictions:
            report = classification_report(
                prediction.y_true, prediction.y_pred, target_names=self.class_names, output_dict=True)
            report.pop("accuracy")
            report = pd.DataFrame(report).T
            report = report.drop("support", axis=1)
            # Change column names to start with uppercase letters
            report = report.rename(columns=lambda x: x.capitalize())
            reports.append(report)
        report = mean_summarize_table(reports)
        show(report.round(self.round))

    def _display_confusion_matrix_for(self, predictions: list[Prediction], set_name: str):
        """Display confusion matrix for a given set of predictions."""
        display(md(f"#### Confusion matrix ({set_name})"))
        confs = []
        for prediction in predictions:
            conf = confusion_matrix(
                prediction.y_true, prediction.y_pred, labels=prediction.y_true.unique())
            true_labels = [f"true {label}" for label in self.class_names]
            predicted_labels = [
                f"predicted {label}" for label in self.class_names]
            conf = pd.DataFrame({label: row for label, row in zip(
                true_labels, conf)}, index=predicted_labels)
            confs.append(conf)
        conf = mean_summarize_table(confs)
        show(conf.round(self.round))

    def _display_shapley_values(self):
        self._display_shapley_values_for(
            self._train_predictions, "train data")
        self._display_shapley_values_for(
            self._test_predictions, "test data")

    def _display_shapley_values_for(self, predictions: list[Prediction], set_name: str):
        """
        Display Shapley values for a given set of models and features.

        Note: this method is currently not used.
        """
        display(md(f"#### Shapley values [mean abs] ({set_name})"))
        shaps = {class_name: [] for class_name in self.class_names}
        for model, prediction in zip(self.models, predictions):
            explainer = shap.Explainer(model)
            shap_values = explainer.shap_values(prediction.X)
            for class_name, shap_values_class in zip(self.class_names, shap_values):
                shaps[class_name].append(
                    np.absolute(shap_values_class).mean(0))
        shaps = {class_name: np.stack(shaps_class)
                 for class_name, shaps_class in shaps.items()}
        shaps_mean = pd.DataFrame(
            {class_name: shaps_class.mean(
                0) for class_name, shaps_class in shaps.items()},
            index=self.x.columns
        )
        shaps_mean["sum"] = shaps_mean.sum(1)
        shaps_mean = shaps_mean.sort_values("sum", ascending=False)
        shaps_mean = shaps_mean.drop("sum", axis=1)
        shaps_std = pd.DataFrame(
            {class_name: shaps_class.std(
                0) for class_name, shaps_class in shaps.items()},
            index=self.x.columns
        )
        shaps_std = shaps_std.loc[shaps_mean.index]
        shaps_mean = shaps_mean.head(10)
        shaps_std = shaps_std.head(10)
        fig, ax = plt.subplots()
        bottom = np.zeros(len(shaps_mean))
        for class_name in shaps_mean.columns:
            ax.bar(
                shaps_mean.index,
                shaps_mean[class_name],
                yerr=shaps_std[class_name],
                label=class_name,
                bottom=bottom,
            )
            bottom += shaps_mean[class_name]
        plt.legend(loc="upper right")
        plt.xticks(rotation=90)
        plt.show(fig)

    def display_roc_curve(self, summary_ax: plt.Axes):
        """
        Display ROC curve in the summary graph.
        In the CV mode, additionally display ROC curves for each fold.
        """
        tprs = []
        aucs = []
        mean_fpr = np.linspace(0, 1, 100)
        # calculate true positive and false positive rates for each fold
        for fold, (model, prediction) in enumerate(zip(self.models, self._test_predictions)):
            fpr, tpr, _ = roc_curve(prediction.y_true, prediction.y_prob)
            # interpolate the ROC curve
            interp_tpr = np.interp(mean_fpr, fpr, tpr)
            interp_tpr[0] = 0.0
            roc_auc = auc(mean_fpr, interp_tpr)
            tprs.append(interp_tpr)
            aucs.append(roc_auc)
        # get mean values
        mean_tpr = np.mean(tprs, axis=0)
        mean_tpr[-1] = 1.0
        mean_auc = auc(mean_fpr, mean_tpr)
        std_auc = np.std(aucs)
        if self.mode == PredictionSettings.AnalysisMode.CROSS_VALIDATION:
            label = rf"{self.model_name} (AUC = %0.2f $\pm$ %0.2f)" % (
                mean_auc, std_auc)
        else:
            label = rf"{self.model_name} (AUC = %0.2f)" % mean_auc
        # plot the mean value on the summary graph
        summary_ax.plot(
            mean_fpr,
            mean_tpr,
            label=label,
            lw=2,
            alpha=0.8,
        )
        # if analysis mode is cross-validation, also plot ROC curves for each fold
        if self.mode == PredictionSettings.AnalysisMode.CROSS_VALIDATION:
            fig, ax = plt.subplots(figsize=(10, 10))
            for i, tpr in enumerate(tprs):
                ax.plot(mean_fpr, tpr, color="grey", alpha=0.3,
                        label=f"ROC CV iteration {i+1}, AUC = {aucs[i]:.2f}")
            std_tpr = np.std(tprs, axis=0)
            tprs_upper = np.minimum(mean_tpr + std_tpr, 1)
            tprs_lower = np.maximum(mean_tpr - std_tpr, 0)
            ax.fill_between(
                mean_fpr,
                tprs_lower,
                tprs_upper,
                color="grey",
                alpha=0.2,
                label=r"$\pm$ 1 std. dev.",
            )
            ax.set_title(self.model_name)
            ax.set(
                xlim=[-0.05, 1.05],
                ylim=[-0.05, 1.05],
                xlabel="Fraction of false positives",
                ylabel="Fraction of true positives",
            )
            ax.axis("square")
            ax.legend(loc="lower right")
