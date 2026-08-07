import json

from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import APIException


class GeneralApiException(APIException):
    detail: str
    err_msg_id: str
    status_code: int

    def __init__(self, status_code: int, detail: str, err_msg_id: str):
        super().__init__(detail, status_code)
        self.detail = detail
        self.err_msg_id = err_msg_id
        self.status_code = status_code


class MissingParameterException(GeneralApiException):
    def __init__(self, missing_label: str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail=missing_label,
                         err_msg_id=f"parameter_required")


class InvalidRequestException(GeneralApiException):
    def __init__(self, msg: str = None, msg_id: str = None):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail=msg or "Invalid request",
                         err_msg_id=msg_id or "invalid_request")


class TaskNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Task has not been found",
                         err_msg_id="task_not_found")


class AlgorithmNotFoundException(GeneralApiException):
    def __init__(self, detail="Algorithm has not been found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail=detail,
                         err_msg_id="algorithm_not_found")


class AlgorithmParametersNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Algorithm parameters for these answers do not exist",
                         err_msg_id="algorithm_parameters_not_found")


class ProblemTypeMismatchException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail="Problem type mismatch",
                         err_msg_id="problem_type_mismatch")


class DatasetNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Dataset has not been found",
                         err_msg_id="dataset_not_found")


class MultipleDatasetsNotFoundException(GeneralApiException):
    def __init__(self, indices: list):
        detail = {"datasets": indices}
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail=json.dumps(detail),
                         err_msg_id="datasets_not_found")


class ImportanceResultNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Importance result has not been found",
                         err_msg_id="importance_result_not_found")


class PredictionResultNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Prediction result has not been found",
                         err_msg_id="prediction_result_not_found")


class ResultNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Result has not been found",
                         err_msg_id="result_not_found")


class RulesetNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Ruleset has not been found",
                         err_msg_id="ruleset_not_found")


class MultipleRulesetsNotFoundException(GeneralApiException):
    def __init__(self, indices: list):
        detail = {"rulesets": indices}
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail=json.dumps(detail),
                         err_msg_id="rulesets_not_found")


class LabelNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Label has not been found",
                         err_msg_id="label_not_found")


class RuleNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Rule has not been found",
                         err_msg_id="rule_not_found")


class DatasetAttributesNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Dataset attributes not found",
                         err_msg_id="dataset_attributes_not_found")


class ProjectNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Project not found",
                         err_msg_id="project_not_found")


class MultipleProjectsNotFoundException(GeneralApiException):
    def __init__(self, indices: list):
        detail = {"projects": indices}
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail=json.dumps(detail),
                         err_msg_id="projects_not_found")


class ReportNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="Report not found",
                         err_msg_id="report_not_found")


class ProjectExistsException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail="Project already exists",
                         err_msg_id="project_exists")


class DatasetExistsException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail="Dataset with this name already exists in this project",
                         err_msg_id="dataset_exists")


class LabelExistsException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail="Label already exists",
                         err_msg_id="label_exists")


class RulesetExistsException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail="Ruleset already exists",
                         err_msg_id="ruleset_exists")


class ReportExistsException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail="Report already exists",
                         err_msg_id="report_exists")


class DatasetReadWriteException(GeneralApiException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                         detail=detail,
                         err_msg_id="dataset_read_write_error")


class RulesetNotSavedException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                         detail="Ruleset not saved.",
                         err_msg_id="ruleset_not_saved")


class ExternalServiceException(GeneralApiException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(
            status_code=status_code,
            detail=detail,
            err_msg_id="external_service_error"
        )


class TaskQueueOfflineException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="There was an error with starting your task. Please try again later.",
            err_msg_id="task_queue_offline"
        )


class UnsupportedDownloadFileTypeException(GeneralApiException):
    def __init__(self):
        detail = {"supported_types": settings.ALLOWED_DOWNLOAD_TYPES}
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail=json.dumps(detail),
                         err_msg_id="unsupported_download_file_type")


class InvalidColumnTypeException(GeneralApiException):
    def __init__(self, col_type: str, allowed_types: list):
        detail = {"col_type": col_type, "allowed_types": allowed_types}
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id="invalid_column_type"
        )


class InvalidEncodingException(GeneralApiException):
    def __init__(self, encoding: str):
        detail = {"encoding": encoding,
                  "allowed_codecs": settings.ALLOWED_CODECS}
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id="invalid_encoding"
        )


class InvalidDatasetException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid dataset file.",
            err_msg_id="invalid_dataset"
        )


class EmptyDatasetException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The dataset is empty.",
            err_msg_id="empty_dataset"
        )


class InvalidColumnNumberException(GeneralApiException):
    def __init__(self, number: int, min_number: int, problem_type: str):
        detail = {"number": number, "min_number": min_number,
                  "problem_type": problem_type}
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id="invalid_column_number"
        )


class MissingColumnRoleException(GeneralApiException):
    def __init__(self, role: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=role,
            err_msg_id="missing_column_role"
        )


class InvalidColumnNames(GeneralApiException):
    def __init__(self, columns: list):
        detail = {"columns": columns}
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id="invalid_column_names"
        )


class MissingColumn(GeneralApiException):
    def __init__(self, columns: list):
        detail = {"missing columns": columns}
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id="missing_column"
        )


class InvalidColumnSelection(GeneralApiException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            err_msg_id="invalid_column_selection"
        )


class ColumnCastingException(GeneralApiException):
    def __init__(self, col_name: str, col_type: str):
        detail = {"col_name": col_name, "col_type": col_type}
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id="column_casting_error"
        )


class InconsistentColumnTypesException(GeneralApiException):
    def __init__(self, columns: list[str]):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps({"columns": columns}),
            err_msg_id="inconsistent_column_types"
        )


class UnsupportedProblemTypeException(GeneralApiException):
    def __init__(self, problem_type: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=problem_type,
            err_msg_id="unsupported_problem_type_error"
        )


class InvalidAttributeTypeException(GeneralApiException):
    def __init__(
        self,
        atribute_role: str,
        expected_type: str,
        actual_type: str
    ):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps({
                "attribute_role": atribute_role,
                "expected_type": expected_type,
                "actual_type": actual_type,
            }),
            err_msg_id="invalid_attribute_type_error"
        )


class NoLabelAttributeSpecifiedException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No label attribute specified for given dataset.",
            err_msg_id="no_label_attribute_specified"
        )


class InvalidLabelColumnValues(GeneralApiException):
    def __init__(self, problem_type: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                'classification': 'Label column must have at least 2 unique values.',
                'survival': 'Survival status column must contain exactly 2 unique values of 0 and 1.',
            }[problem_type],
            err_msg_id="invalid_label_column_values"
        )


class TooManyClassesException(GeneralApiException):
    def __init__(self):
        detail = {"limit": settings.MAX_CLASSES}
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id="too_many_classes"
        )


class EmptyLabelColumnValues(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Label column cannot contain empty values.',
            err_msg_id="empty_label_column_values"
        )


class InvalidSurvivalTimeColumnValues(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Survival time column must contain values greater than 0.0.',
            err_msg_id="invalid_survival_time_column_values"
        )


class EmptySurvivalTimeColumnValues(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Survival time cannot contain empty values.',
            err_msg_id="empty_survival_time_column_values"
        )


class DatasetSizeConstraintViolation(GeneralApiException):
    def __init__(self, parameter: str, limit: int or str, value: int or str):
        detail = {"limit": limit, "value": value}
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail=json.dumps(detail),
                         err_msg_id=f"{parameter}_limit_exceeded")


class DatasetMaxRowsViolation(DatasetSizeConstraintViolation):
    def __init__(self, limit: int, value: int):
        super().__init__(parameter="max_rows", limit=limit, value=value)


class DatasetMaxColumnsViolation(DatasetSizeConstraintViolation):
    def __init__(self, limit: int, value: int):
        super().__init__(parameter="max_columns", limit=limit, value=value)


class DatasetMaxSizeViolation(DatasetSizeConstraintViolation):
    def __init__(self, limit: int, value: int):
        limit = limit / 1024 / 1024
        limit = f"{limit:.2f} MB"
        value = value / 1024 / 1024
        value = f"{value:.2f} MB"
        super().__init__(parameter="max_size", limit=limit, value=value)


class DatasetMaxSumSizeViolation(DatasetSizeConstraintViolation):
    def __init__(self, limit: int, value: int):
        limit = limit / 1024 / 1024
        limit = f"{limit:.2f} MB"
        value = value / 1024 / 1024
        value = f"{value:.2f} MB"
        super().__init__(parameter="max_sum_size", limit=limit, value=value)


class MaxNumberOfObjectsViolation(GeneralApiException):
    def __init__(self, object_name: str, limit: int):
        detail = {"limit": limit}
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST,
                         detail=json.dumps(detail),
                         err_msg_id=f"{object_name}_limit_reached")


class MaxNumberOfProjectsViolation(MaxNumberOfObjectsViolation):
    def __init__(self, limit: int):
        super().__init__(object_name="projects", limit=limit)


class MaxNumberOfDatasetsViolation(MaxNumberOfObjectsViolation):
    def __init__(self, limit: int):
        super().__init__(object_name="datasets", limit=limit)


class MaxNumberOfRulesetsViolation(MaxNumberOfObjectsViolation):
    def __init__(self, limit: int):
        super().__init__(object_name="rulesets", limit=limit)


class MaxNumberOfReportsViolation(MaxNumberOfObjectsViolation):
    def __init__(self, limit: int):
        super().__init__(object_name="reports", limit=limit)


class InvalidExpertConditionType(GeneralApiException):
    def __init__(self, parameter_name: str, condition: dict):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                'parameter_name': parameter_name,
                'condition': condition
            },
            err_msg_id="invalid_expert_condition_type"
        )


class InvalidExpertCondition(GeneralApiException):
    def __init__(self, parameter_name: str, condition: dict):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                'parameter_name': parameter_name,
                'condition': condition
            },
            err_msg_id="invalid_expert_condition_type"
        )


class TaskAlreadyCompletedException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="This task cannot be aborted at this stage.",
            err_msg_id="task_already_completed"
        )


class ReportDownloadError(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while downloading the report.",
            err_msg_id="report_download_error"
        )


class NoExamplesCoveredError(GeneralApiException):
    def __init__(self, problematic_items: list[int]):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps({
                'detail': "Given conditions do not cover any examples.",
                'problematic_items': problematic_items
            }),
            err_msg_id="no_example_covered_error"
        )


class NoFileProvidedException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided for upload.",
            err_msg_id="no_file_provided"
        )


class UnsupportedFileTypeException(GeneralApiException):
    def __init__(self, file_type: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_type}.",
            err_msg_id="unsupported_file_type"
        )


class RulesetJSONDeserializationException(GeneralApiException):
    def __init__(self, error_message: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error deserializing ruleset JSON: {error_message}.",
            err_msg_id="ruleset_json_deserialization_error"
        )


class InvalidRuleFormatException(GeneralApiException):
    def __init__(self, rule: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rule format: {rule}",
            err_msg_id="invalid_rule_format"
        )


class MissingPercentageOfNoiseException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Percentage of noise not provided.",
            err_msg_id="percentage_of_noise_missing"
        )


class InvalidPercentageOfNoiseFormatException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format for percentage of noise. It must be a number.",
            err_msg_id="invalid_percentage_of_noise_format"
        )


class NumericAttributeNotFoundException(GeneralApiException):
    def __init__(self, attributes_not_found: list[str]):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=json.dumps({
                'detail': "Dataset has no numeric attributes with given names.",
                'attributes': attributes_not_found
            }),
            err_msg_id="numeric_dataset_attributes_not_found"
        )


class AttributeMismatchException(GeneralApiException):
    def __init__(self, missing_in_dataset: list[str]):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing attributes in dataset: {missing_in_dataset}",
            err_msg_id="attribute_mismatch_error"
        )


class TargetAttributeMismatchException(GeneralApiException):
    def __init__(self, wrong_attribute: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incompatible target attribute: {wrong_attribute}",
            err_msg_id="target_attribute_mismatch_error"
        )


class IncorrectReportParametersException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect report parameters.",
            err_msg_id="incorrect_report_parameters"
        )


class ExcessiveNumberOfBinsException(GeneralApiException):
    def __init__(self, min_bins: int, max_bins: int):
        detail = {
            "detail": "Number of bins out of allowed range.",
            "min_bins": min_bins,
            "max_bins": max_bins
        },
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id="intervals_value"
        )


class TourNotCompletedYet(GeneralApiException):

    def __init__(self, tour_name: str):
        detail = {
            "detail": "Tour has not been completed by a user yet.",
            "tour_name": tour_name,
        },
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=json.dumps(detail),
            err_msg_id="tour_not_completed_yet"
        )


class UploadRulesetFactoriesException(GeneralApiException):
    def __init__(self, err_msg_id: str, detail: dict):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id=err_msg_id
        )


class EmptyColumnException(GeneralApiException):

    def __init__(self, column_names: str):
        detail = {
            "detail": f"Column is entirely empty.",
            "column_names": column_names,
        }
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=json.dumps(detail),
            err_msg_id="empty_column"
        )


class KeycloakUserDeletionException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user in Keycloak.",
            err_msg_id="keycloak_user_deletion_failed"
        )


class GeneralUserDeletionException(GeneralApiException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting the user.",
            err_msg_id="general_user_deletion_error"
        )


class ReportDeleteException(GeneralApiException):
    def __init__(self, detail):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            err_msg_id="report_delete_error"
        )


class UserNotFoundException(GeneralApiException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND,
                         detail="User not found",
                         err_msg_id="user_not_found")
