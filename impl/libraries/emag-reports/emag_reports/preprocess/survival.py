from sklearn.model_selection import StratifiedKFold
from sklearn.model_selection import StratifiedShuffleSplit


class BaseSurvivalStratifiedSplit:
    """
    Base class for stratified split cross-validators for survival data.
    """

    def __init__(self, stratify_by: str, time_attribute: str):
        self.column = stratify_by
        self.time_attribute = time_attribute

    def swap_max_time_samples(self, train_index, test_index, y):
        max_train_idx_local = y[self.time_attribute][train_index].argmax()
        max_test_idx_local = y[self.time_attribute][test_index].argmax()

        max_train_idx = train_index[max_train_idx_local]
        max_test_idx = test_index[max_test_idx_local]
        if y[self.time_attribute][max_train_idx] < y[self.time_attribute][max_test_idx]:
            train_index[max_train_idx_local], test_index[max_test_idx_local] = test_index[max_test_idx_local], train_index[max_train_idx_local]

        return train_index, test_index


class SurvivalStratifiedKFold(BaseSurvivalStratifiedSplit, StratifiedKFold):
    """
    Stratified K-Fold cross-validator (dataset split) for survival data.
    """

    def __init__(self, stratify_by: str, time_attribute: str, *args, **kwargs):
        BaseSurvivalStratifiedSplit.__init__(self, stratify_by, time_attribute)
        StratifiedKFold.__init__(self, *args, **kwargs)

    def split(self, X, y, groups=None):
        splits = []
        for train_index, test_index in super(StratifiedKFold, self).split(X, y[self.column], groups):
            train_index, test_index = self.swap_max_time_samples(
                train_index, test_index, y)
            splits.append((train_index, test_index))
        return splits


class SurvivalStratifiedShuffleSplit(BaseSurvivalStratifiedSplit, StratifiedShuffleSplit):
    """
    Stratified ShuffleSplit cross-validator (dataset split) for survival data.
    """

    def __init__(self, stratify_by: str, time_attribute: str, *args, **kwargs):
        BaseSurvivalStratifiedSplit.__init__(self, stratify_by, time_attribute)
        StratifiedShuffleSplit.__init__(self, *args, **kwargs)

    def split(self, X, y, groups=None):
        splits = []
        for train_index, test_index in super(StratifiedShuffleSplit, self).split(X, y[self.column], groups):
            train_index, test_index = self.swap_max_time_samples(
                train_index, test_index, y)
            splits.append((train_index, test_index))
        return splits
