from emag_reports.discovery.indicators import calculate_classification_indicators
from emag_reports.discovery.indicators import calculate_regression_indicators
from emag_reports.preprocess.encode_decode import encode_dataset
from IPython.display import display
from IPython.display import Markdown as md
from sklearn.tree import DecisionTreeClassifier
from sklearn.tree import DecisionTreeRegressor
from sklearn.tree import export_text


def build_and_show_classification_decision_tree(df, target, max_depth=None):
    """
    Build and display a decision tree for a classification problem.

    Args:
        df (pd.DataFrame): input dataset
        target (str): target column name
        max_depth (int): max depth of the tree
    """
    # Encode dataset
    encoded_df, label_encoder, onehot_encoder, categorical_cols = encode_dataset(
        df, target)

    X = encoded_df.drop(target, axis=1)
    y = encoded_df[target]
    clf = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
    clf.fit(X.values, y)
    predictions = clf.predict(X.values)
    print_tree(clf, encoded_df.columns[:-1], label_encoder.classes_)
    calculate_classification_indicators(y, predictions, label_encoder.classes_)


def build_and_show_regression_decision_tree(df, target, max_depth=None):
    """
    Build and display a decision tree for a regression problem.

    Args:
        df (pd.DataFrame): input dataset
        target (str): target column name
        max_depth (int): max depth of the tree
    """
    # Encode dataset
    encoded_df, _, onehot_encoder, categorical_cols = encode_dataset(
        df, target, False)

    X = encoded_df.drop(target, axis=1)
    y = encoded_df[target]

    reg = DecisionTreeRegressor(max_depth=max_depth, random_state=42)
    reg.fit(X.values, y)
    predictions = reg.predict(X.values)
    print_tree(reg, X.columns)
    calculate_regression_indicators(y, predictions)


def print_tree(model, features, class_names=None):
    """
    Print the decision tree structure.

    Args:
        model (object): trained decision tree model
        features: list of feature names
        class_names: list of class names
    """
    if class_names is not None:
        class_names = [str(class_) for class_ in class_names]
    tree_text = export_text(
        model,
        feature_names=features,
        class_names=class_names
    )
    display(md("#### Tree structure:"))
    print(tree_text)
