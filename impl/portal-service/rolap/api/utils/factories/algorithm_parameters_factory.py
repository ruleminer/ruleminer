from math import floor
from typing import Any
from typing import Iterable
from typing import Union

from django.conf import settings
from rest_framework.exceptions import ValidationError
from rest_framework.serializers import Serializer
from rolap.api.exceptions import AlgorithmParametersNotFoundException
from rolap.api.exceptions import InvalidExpertCondition
from rolap.api.exceptions import InvalidExpertConditionType
from rolap.api.exceptions import InvalidPercentageOfNoiseFormatException
from rolap.api.exceptions import MissingPercentageOfNoiseException
from rolap.api.exceptions import ProblemTypeMismatchException
from rolap.api.models import Algorithm
from rolap.api.models import AlgorithmParams
from rolap.api.models import Dataset
from rolap.api.models import Project
from rolap.api.models.algorithms.questions import NAAlgorithmParameters
from rolap.api.models.rulesets.rulesets import CreateRulesetRequest
from rolap.api.serializers.expert_induction import NominalConditionSerializer
from rolap.api.serializers.expert_induction import NumericalConditionSerializer
from rolap.api.serializers.rulesets.algorithms import NAAlgorithmParametersSerializer
from rolap.api.serializers.rulesets.algorithms import RequestNAAlgorithmParametersSerializer
from rolap.api.serializers.rulesets.creation import ExpertInductionSerializer


class AlgorithmParametersFactory:
    """
    Processes input data from requests into algorithm parameters ready to use by some
    rule induction algorithm e.g. RuleKit.

    There are two main branches of logic here:
    a) getting algorithm parameters explicitly provided in the request body and returning them after validation
        and filling missing values with defaults from the database,
    b) processing answers to survey questions and returning algorithm parameters based on them.

    In case of b, the survey can contain additional parameters (`extra_values`), which are taken into account when processing.
    Currently only one such additional parameter is supported: `prct_of_noise`, which is used to calculate the `max_uncovered_fraction` parameter.
    """

    def __init__(self, dataset: Dataset, algorithm: Algorithm):
        if dataset.project.type_of_problem != algorithm.problem_type:
            raise ProblemTypeMismatchException()
        self.dataset: Dataset = dataset
        self.algorithm: Algorithm = algorithm

    def get_algorithm_params(self, request_data: dict) -> dict:
        if "survey" in request_data:
            return self.get_from_survey(request_data["survey"])
        else:
            return self.get_from_body(request_data["algorithm_params"])

    def get_from_survey(self, survey: dict) -> dict:
        answers_serializer = RequestNAAlgorithmParametersSerializer(
            data=survey
        )
        answers_serializer.is_valid(raise_exception=True)
        answers: dict = answers_serializer.data.get("answers")
        data_string: str = "_".join(
            [f"{key}.{value}" for key, value in answers.items()])

        try:
            params = NAAlgorithmParameters.objects.filter(
                algorithm=self.algorithm)
            params_for_answer = params.filter(answer_string=data_string)
            if params_for_answer.exists():
                params = params_for_answer.get()
            else:
                params = params.filter(answer_string="default").get()
            serializer: NAAlgorithmParametersSerializer = NAAlgorithmParametersSerializer(
                params)
        except NAAlgorithmParameters.DoesNotExist:
            raise AlgorithmParametersNotFoundException()

        params_data = serializer.data.get("params_json")
        params_data = self._process_special_algorithm_parameters(
            params_data, answers_serializer)
        return params_data

    def get_from_body(self, body_params: dict) -> dict:
        db_params: dict[str, AlgorithmParams] = {
            param.name: param for param in self.algorithm.parameters
        }
        self._validate_algorithm_params(body_params, db_params)
        algorithm_params: dict = self._get_algorithm_params_with_defaults(
            body_params, db_params)
        return algorithm_params

    def _process_special_algorithm_parameters(self, params_data: dict, answers_serializer: Serializer) -> dict:
        if "max_uncovered_fraction" in params_data:
            params_data["max_uncovered_fraction"] = self._process_max_uncovered_fraction(
                params_data["max_uncovered_fraction"], answers_serializer)
        # other dict values are not currently supported (but they are not in currently used algorithms in DB)
        for param, value in params_data.items():
            if isinstance(value, dict):
                raise NotImplementedError(
                    f"Support for special values of parameter {param} is not implemented.")
        return params_data

    def _process_max_uncovered_fraction(self, max_uncovered_fraction: Union[float, dict], answers_serializer: Serializer) -> float:
        if isinstance(max_uncovered_fraction, dict):
            if self.dataset.project.type_of_problem != Project.CLASSIFICATION:
                raise ValueError(
                    "Dict values of `max_uncovered_fraction` are only supported for classification problems")
            if "min_part_of_smallest_cls" not in max_uncovered_fraction:
                raise ValueError(
                    "Invalid dict value for `max_uncovered_fraction`")
            min_part_of_cls = max_uncovered_fraction["min_part_of_smallest_cls"]
            smallest_class_count = min(
                self.dataset.class_distribution.values())
            part_of_smallest_class = floor(
                smallest_class_count * min_part_of_cls)
            total_count = sum(self.dataset.class_distribution.values())
            max_uncovered_fraction = part_of_smallest_class / total_count
        try:
            prct_of_noise = answers_serializer.data.get(
                "extra_values", {}).get("prct_of_noise", 100)
            if prct_of_noise is None:
                raise MissingPercentageOfNoiseException()
            if not isinstance(prct_of_noise, (int, float)):
                raise InvalidPercentageOfNoiseFormatException()
            prct_of_noise = prct_of_noise / 100
            max_uncovered_fraction_val = min(
                max_uncovered_fraction, prct_of_noise)
        except (KeyError, ValueError, TypeError) as e:
            raise ValueError(
                f"Error processing 'percentage of noise' value: {str(e)}")

        return round(
            max_uncovered_fraction_val, settings.ROUND_DECIMAL_PLACES)

    def _validate_algorithm_params(
        self,
        algorithm_params: dict[str, Any],
        db_params: dict[str, AlgorithmParams]
    ):
        """Validates algorithm parameters passed in the request body

        Args:
            algorithm_params (dict): algorithm parameters to validate.
            db_params (dict[str, AlgorithmParams]): dictionary where keys are parameter
                names and values are database parameters definitions.

        Raises:
            InvalidRequestException: If the algorithm parameters are invalid.
        """
        # initialize errors dict
        errors = {}
        # check all algorithm params against their database counterparts
        for param in algorithm_params:
            # check if parameter exists in the database and does not pertain to expert induction.
            db_param: AlgorithmParams = db_params.get(param)
            if db_param is None:
                errors[param] = f"Invalid parameter for algorithm {self.algorithm.name} v. {self.algorithm.version}"  # noqa
                continue
            # check if parameter value is valid
            if not db_param.validate_value(algorithm_params[param]):
                errors[param] = f"Parameter has invalid value `{algorithm_params[param]}`"  # noqa
        # raise exception if errors are found
        if errors:
            raise ValidationError(errors)

    def _get_algorithm_params_with_defaults(
        self,
        user_params: dict[str, Any],
        db_params: dict[str, AlgorithmParams]
    ) -> dict:
        params = {}
        errors: dict[str, str] = {}
        for param_name, db_param in db_params.items():
            try:
                if param_name in user_params:
                    params[param_name] = db_param.cast_value(
                        user_params[param_name]
                    )
                else:
                    params[param_name] = db_param.cast_value(
                        db_param.default_value
                    )
            except ValueError as error:
                errors[param_name] = str(error)
        if errors:
            raise ValidationError(errors)
        return params

    def prepare_expert_induction_parameters(self, ruleset_request: CreateRulesetRequest) -> dict:
        expert_induction: dict = ruleset_request.expert_induction
        if expert_induction is None or len(expert_induction) == 0:
            return None
        # Validate params using the ExpertInductionSerializer
        expert_induction_serializer = ExpertInductionSerializer(
            data=expert_induction)
        if not expert_induction_serializer.is_valid():
            raise ValidationError(expert_induction_serializer.errors)
        expert_induction_for_rulekit = self._prepare_expert_induction_params_for_rulekit(
            expert_induction, self.dataset.project.type_of_problem)
        self._validate_expert_params(expert_induction_for_rulekit)
        return expert_induction_for_rulekit

    def _validate_expert_params(self, expert_induction_params: dict):
        """Validates expert induction parameters passed in the request body

        Args:
            expert_induction_params (dict): the expert induction parameters to validate.

        Raises:_to_string
            InvalidRequestException: If the expert induction parameters are invalid.
        """
        # initialize errors dict
        errors = {}
        # check all  params against their database counterparts
        db_algorithm_params = self.algorithm.algorithm_parameters
        for param in expert_induction_params:
            # check if parameter exists in the database and pertains to expert induction.
            db_param = db_algorithm_params.filter(name=param)
            if not db_param.exists() or not db_param.first().expert_induction:
                errors[param] = f"Invalid expert induction parameter for algorithm {algorithm.name} v. {algorithm.version}"  # noqa
                continue
        # raise exception if errors are found
        if errors:
            raise ValidationError(errors)

    def _prepare_expert_induction_params_for_rulekit(self, data: dict, problem_type: str) -> dict:
        prepared_data = {
            "expert_rules": [],
            "expert_preferred_conditions": [],
            "expert_forbidden_conditions": [],
            "extend_using_preferred": data["extend_using_preferred"],
            "extend_using_automatic": data["extend_using_automatic"],
            "induce_using_preferred": data["induce_using_preferred"],
            "induce_using_automatic": data["induce_using_automatic"],
            "preferred_conditions_per_rule": data["preferred_conditions_per_rule"],
            "preferred_attributes_per_rule": data["preferred_attributes_per_rule"],
        }
        # this specific parameter is used only in rulekit
        if problem_type == "classification":
            prepared_data["consider_other_classes"] = data["consider_other_classes"]

        # Processing expert rules
        for i, rule in enumerate(data["expert_rules"]):
            rule_str = self._expert_rule_to_string(
                rule["premise"]["operator"],
                rule["premise"]["subconditions"],
                rule["conclusion"]["value"],
                data["decision_attribute"],
                parameter_name="expert_rules"
            )
            prepared_data["expert_rules"].append((
                f"expert_rules-{i + 1}",
                rule_str
            ))

        # Processing preferred conditions and attributes
        for class_name, conditions in data["expert_preferred_conditions"].items():
            for i, condition in enumerate(conditions):
                rule_str = self._expert_rule_to_string(
                    condition["operator"],
                    condition["subconditions"],
                    class_name,
                    data["decision_attribute"],
                    parameter_name="expert_preferred_conditions",
                    number=condition.get("number"),
                )
                prepared_data["expert_preferred_conditions"].append((
                    f"expert_preferred_conditions-{class_name}-{i + 1}",
                    rule_str
                ))

        preferred_attributes_str = self._parse_preferred_attributes(
            data["expert_preferred_attributes"], data["decision_attribute"])
        prepared_data["expert_preferred_conditions"].extend(
            preferred_attributes_str)

        # Processing forbidden conditions and attributes
        for class_name, conditions in data["expert_forbidden_conditions"].items():
            for i, condition in enumerate(conditions):
                rule_str = self._expert_rule_to_string(
                    condition["operator"],
                    condition["subconditions"],
                    class_name,
                    data["decision_attribute"],
                    parameter_name="expert_forbidden_conditions"
                )
                prepared_data["expert_forbidden_conditions"].append((
                    f"expert_forbidden_conditions-{class_name}-{i + 1}",
                    rule_str
                ))

        forbidden_attributes_str = self._parse_forbidden_attributes(
            data["expert_forbidden_attributes"], data["decision_attribute"])
        prepared_data["expert_forbidden_conditions"].extend(
            forbidden_attributes_str)

        return prepared_data

    def _expert_rule_to_string(
        self,
        operator: str,
        subconditions: list,
        conclusion_value: str,
        decision_attribute: str,
        parameter_name: str,
        number: str = None,
    ) -> str:
        converted_subconditions = [
            self._condition_to_string(condition, parameter_name)
            for condition in subconditions
        ]
        operator_str = " AND " if operator == "CONJUNCTION" else " OR "
        conditions_str = operator_str.join(converted_subconditions)
        conclusion_str = (
            f"{decision_attribute} = {{{conclusion_value}}}"
            if self.dataset.project.type_of_problem == Project.CLASSIFICATION else ""
        )
        rule_str = f"IF {conditions_str} THEN {conclusion_str}"  # noqa
        return rule_str if number is None else f"{number}: {rule_str}"  # noqa

    def _condition_to_string(self, condition_dict: dict, parameter_name: str) -> str:
        try:
            condition_type: str = condition_dict.get("type")
            condition_parser = {
                "elementary_numerical": self._numerical_condition_to_string,
                "elementary_nominal": self._nominal_condition_to_string,
            }[condition_type]
        except KeyError as error:
            raise InvalidExpertConditionType(
                parameter_name, condition_dict
            ) from error

        try:
            return condition_parser(condition_dict)
        except KeyError as error:
            raise InvalidExpertCondition(
                parameter_name, condition_dict
            ) from error

    @staticmethod
    def _numerical_condition_to_string(condition_dict: dict) -> str:
        serializer = NumericalConditionSerializer(data=condition_dict)
        serializer.is_valid(raise_exception=True)
        return str(serializer)

    @staticmethod
    def _nominal_condition_to_string(condition_dict: dict) -> str:
        serializer = NominalConditionSerializer(data=condition_dict)
        serializer.is_valid(raise_exception=True)
        return str(serializer)

    def _parse_preferred_attributes(self, preferred_attributes: dict, decision_attribute: str) -> list[tuple[str, str]]:
        preferred_rules = []
        for class_name, attributes in preferred_attributes.items():
            for attribute, number in attributes.items():
                conclusion_str = (
                    f"{decision_attribute} = {{{class_name}}}"
                    if self.dataset.project.type_of_problem == Project.CLASSIFICATION else ""
                )
                rule = f"{number}: IF {attribute} = Any THEN {conclusion_str}"  # noqa
                preferred_rules.append((
                    f"preferred_attributes-{class_name}-{attribute}",
                    rule
                ))
        return preferred_rules

    def _parse_forbidden_attributes(self, forbidden_attributes: dict, decision_attribute: dict) -> list[tuple[str, str]]:
        forbidden_rules = []
        for class_name, attributes in forbidden_attributes.items():
            for attribute in attributes:
                conclusion_str = (
                    f"{decision_attribute} = {{{class_name}}}"
                    if self.dataset.project.type_of_problem == Project.CLASSIFICATION else ""
                )
                rule = f"IF {attribute} = Any THEN {conclusion_str}"  # noqa
                forbidden_rules.append((
                    f"preferred_attributes-{class_name}-{attribute}",
                    rule
                ))
        return forbidden_rules
