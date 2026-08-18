import matplotlib.pyplot as plt
import pandas as pd
from emag_reports.logger import logger
from emag_reports.models.prediction import PredictionSettings
from emag_reports.prediction.classification import ClassificationManager
from emag_reports.prediction.helpers import ROUND_DECIMAL_PLACES
from emag_reports.prediction.manager import PredictionManager
from IPython.display import display
from IPython.display import Markdown as md
from itables import show

_ = plt.ioff()


class ModelSummarizer:
    """
    Summarize and compare multiple ML models.

    Args:
        models (list[PredictionManager]): list of models to compare
    """
    round = ROUND_DECIMAL_PLACES

    def __init__(self, models: list[PredictionManager]):
        self.models = models

    def compare(self):
        """
        Create and display a dataframe comparing models.
        """
        display(md("## Model comparison"))
        try:
            names = []
            dfs = []
            for model in self.models:
                if not model.trained:
                    continue
                model_df = model.summarize_model()
                if model.grid_search:
                    disp_params = [f"`{key}`: {value}" for key,
                                   value in model.best_params.items()]
                    model_df["Best parameters"] = [", ".join(disp_params)]
                names.append(model.model_name)
                dfs.append(model_df)
            summary = pd.concat(dfs)
            summary.index = names
            show(summary.round(self.round).fillna("-"))
            self._display_summary_graphs()
        except Exception as e:
            logger.exception(e)

    def _display_summary_graphs(self):
        """
        Display summary graphs for each model.
        """


class ClassificationSummarizer(ModelSummarizer):
    def __init__(self, models: list[ClassificationManager], mode: PredictionSettings.AnalysisMode, binary=False):
        super().__init__(models)
        self.mode = mode
        self.binary = binary

    def _display_summary_graphs(self):
        super()._display_summary_graphs()
        if self.binary:
            display(md("#### ROC curves"))
            fig, ax = plt.subplots(figsize=(10, 10))
            for model in self.models:
                if not model.trained:
                    continue
                model.display_roc_curve(ax)
            ax.set(
                xlim=[-0.05, 1.05],
                ylim=[-0.05, 1.05],
                xlabel="Fraction of false positives",
                ylabel="Fraction of true positives",
            )
            ax.axis("square")
            ax.legend(loc="lower right")
            ax.set_title("Comparison of ROC curves")
            plt.show(fig)


class RegressionSummarizer(ModelSummarizer):
    pass


class SurvivalSummarizer(ModelSummarizer):
    def _display_summary_graphs(self):
        fig, ax = plt.subplots()
        fig.set_size_inches(12, 6)
        display(md("#### Cumulative AUC"))
        for model in self.models:
            if not model.trained:
                continue
            model.plot_mean_auc(ax)
        ax.set_xlabel("time $t$")
        ax.set_ylabel("time-dependent AUC")
        plt.legend(loc="lower center")
        plt.grid(True)
        plt.show(fig)
