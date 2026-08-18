from typing import Any

import numpy as np
from settings.common import ROUND_DECIMAL_PLACES


def sanitize_float(value: Any) -> Any:
    if isinstance(value, float):
        if np.isnan(value):
            return None
        elif np.isinf(value):
            if value > 0:
                return "inf"
            else:
                return "-inf"
        return round(value, ROUND_DECIMAL_PLACES)
    return value


def sanitize_data(data: Any) -> Any:
    if isinstance(data, dict):
        return {key: sanitize_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, np.int64):
        return int(data)
    elif isinstance(data, np.ndarray):
        return sanitize_data(data.tolist())
    else:
        return sanitize_float(data)
