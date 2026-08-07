from xgboost import XGBRegressor as XGBRegressorBase


class XGBRegressor(XGBRegressorBase):
    """
    Adapter of `XGBRegressor` for the purpose of being consistent with `scikit-learn` API
    used by default by `PredictionManager`.
    """

    def fit(self, X, y, *args, **kwargs):
        X = X.to_numpy()
        super().fit(X, y, *args, **kwargs)
