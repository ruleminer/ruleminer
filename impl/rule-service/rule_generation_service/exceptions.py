class TaskAborted(Exception):
    pass


class BaseRuleServiceException(Exception):
    def __init__(self, code: str, cause: Exception = None):
        self.code = code
        self.cause = cause
        super().__init__(code)


class DatasetReadError(BaseRuleServiceException):
    def __init__(self, cause: Exception = None):
        super().__init__("dataset_read_error", cause)


class RulesetGenerationError(BaseRuleServiceException):
    def __init__(self, cause: Exception = None):
        super().__init__("ruleset_generation_error", cause)


class EmptyRulesetError(BaseRuleServiceException):
    def __init__(self, cause: Exception = None):
        super().__init__("empty_ruleset_error", cause)


class RulesetProcessingError(BaseRuleServiceException):
    def __init__(self, cause: Exception = None):
        super().__init__("ruleset_processing_error", cause)


class CalculationError(BaseRuleServiceException):
    def __init__(self, cause: Exception = None):
        super().__init__("calculation_error", cause)


class PredictionConfigurationError(BaseRuleServiceException):
    def __init__(self, cause: Exception = None):
        super().__init__("prediction_configuration_error", cause)


class RuleConclusionFormatException(BaseRuleServiceException):
    def __init__(self, conclusion_part: str, cause: Exception = None):
        self.detail = {"conclusion_part": conclusion_part}
        super().__init__("rule_conclusion_format_error", cause)


class RuleConclusionFloatConversionException(BaseRuleServiceException):
    def __init__(self, cause: Exception = None):
        super().__init__("rule_conclusion_float_conversion_error", cause)


class DecisionAttributeMismatchException(BaseRuleServiceException):
    def __init__(self, given_attribute: str, expected_attribute: str, cause: Exception = None):
        self.detail = {
            "given_attribute": given_attribute,
            "expected_attribute": expected_attribute
        }
        super().__init__("decision_attribute_mismatch_error", cause)


class InvalidMeasureNameException(BaseRuleServiceException):
    def __init__(self, cause: Exception = None):
        super().__init__("invalid_measure_name_error", cause)


class InvalidSurvivalTimeAttributeException(BaseRuleServiceException):
    def __init__(self, attribute: str, cause: Exception = None):
        self.detail = {"attribute": attribute}
        super().__init__("invalid_survival_time_attribute_error", cause)


class InvalidConditionFormatException(BaseRuleServiceException):
    def __init__(self, condition_str: str, cause: Exception = None):
        self.detail = {"condition_str": condition_str}
        super().__init__("invalid_condition_format_error", cause)


class AttributeNotFoundException(BaseRuleServiceException):
    def __init__(self, attribute_name: str, cause: Exception = None):
        self.detail = {"attribute_name": attribute_name}
        super().__init__("attribute_not_found_error", cause)


class InvalidNumericValueException(BaseRuleServiceException):
    def __init__(self, operator: str, value: str, cause: Exception = None):
        self.detail = {"operator": operator, "value": value}
        super().__init__("invalid_numeric_value_error", cause)


class InvalidValueFormatException(BaseRuleServiceException):
    def __init__(self, operator: str, value: str, cause: Exception = None):
        self.detail = {"operator": operator, "value": value}
        super().__init__("invalid_value_format_error", cause)


class RulesetFactoriesException(BaseRuleServiceException):
    def __init__(self, code: str, detail: dict, cause: Exception = None):
        self.detail = detail
        super().__init__(code, cause)
