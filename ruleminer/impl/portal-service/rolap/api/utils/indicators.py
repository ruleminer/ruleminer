def sort_importance(importance: dict):
    """Sorts a dictionary of values within classes
    Args:
        importance (dict): Dictionary containing values to be sorted within classes.

    Returns:
        dict: A sorted dictionary with numerical values, "-inf," and "inf."
    """
    for class_key, class_dict in importance.items():
        try:
            sorted_items = sorted(class_dict.items(), key=lambda item: float(item[1]) if item[1] not in [
                                  "-inf", "inf"] else float('-inf' if item[1] == "-inf" else 'inf'), reverse=True)
        except (ValueError, TypeError):
            sorted_items = class_dict.items()

        importance[class_key] = dict(sorted_items)

    return importance
