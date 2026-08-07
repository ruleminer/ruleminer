import pandas as pd
from django.conf import settings
from django.db import IntegrityError
from django.db import transaction
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rolap.api.exceptions import DatasetExistsException
from rolap.api.models.datasets import Dataset
from rolap.api.models.projects import Project
from rolap.api.serializers.datasets import DatasetSplitSerializer
from rolap.api.utils.factories import DerivedDatasetCreator
from rolap.api.views.base import DatasetBaseView
from sklearn.model_selection import train_test_split


class DatasetSplitView(DatasetBaseView):
    """
    A view for splitting datasets into training and testing sets based on specified criteria.

    This view supports various splitting modes including random, stratified, and chronological splits.
    It handles dataset object retrieval, split logic implementation, and saving the resulting datasets.
    """
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ['datasets']

        def get_request_serializer(self, path, method):
            return DatasetSplitSerializer()

        def get_response_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="dataset_split")

    def post(self, request: Request, *args, **kwargs) -> Response:
        """ Handles POST requests to split a dataset into training and testing sets.

        Args:
            request (HttpRequest): The request object containing data for the split.

        Returns:
            Response: A response object indicating the success or failure of the operation.
        """
        serializer = DatasetSplitSerializer(data=request.data)
        dataset: Dataset = self.get_object()
        project: Project = dataset.project
        self.can_split_dataset(project)
        if serializer.is_valid():
            split_ratio = serializer.validated_data['split_ratio']
            training_set_name = serializer.validated_data['training_set_name']
            test_set_name = serializer.validated_data['test_set_name']
            split_mode = serializer.validated_data['split_mode']

            if Dataset.objects.filter(project_id=project.pk).filter(name__in=[training_set_name, test_set_name]).exists():
                raise DatasetExistsException()
            target = dataset.class_attribute
            df: pd.DataFrame
            df, _ = dataset.read_dataset_from_storage()
            X = df.drop(columns=[target])
            y = df[target]
            if split_mode == 'random':
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=split_ratio, random_state=42, shuffle=True)
            elif split_mode == 'stratified':
                if project.type_of_problem == Project.REGRESSION:
                    raise ValueError(
                        "Stratified split is not supported for regression projects.")
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=split_ratio,  random_state=42, shuffle=True, stratify=y)
            elif split_mode == 'chronological':
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=split_ratio,  random_state=42, shuffle=False)
            else:
                return Response({'error': 'Invalid split mode.'}, status=status.HTTP_400_BAD_REQUEST)
            df_train = pd.concat([X_train, y_train], axis=1)
            df_test = pd.concat([X_test, y_test], axis=1)
            with transaction.atomic():
                training_dataset = self._save_dataset(request, df_train, training_set_name,
                                                      dataset, "train", split_mode, split_ratio)
                test_dataset = self._save_dataset(request, df_test, test_set_name,
                                                  dataset, "test", split_mode, split_ratio)
            return Response({"train_dataset_id": training_dataset.id, "test_dataset_id": test_dataset.id}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _save_dataset(self, request: Request, df: pd.DataFrame, df_name: str, original_dataset: Dataset, df_type: str, split_mode: str, split_ratio: float):
        """Creates a new dataset instance with the specified parameters and saves it to the database.

        Args:
            df (pd.DataFrame): The dataframe to save as a new dataset.
            df_name (str): The name for the new dataset.
            original_dataset (Dataset): The original dataset from which df is derived.
            project (Project): The project to which the new dataset belongs
            target_attribute (str): The target attribute
            df_type (str): Indicates whether the dataframe is for training or testing ('train' or 'test').
            split_mode (str): The mode used to split the original dataset ('random', 'stratified', or 'chronological').
            split_ratio (float): The ratio used to split the dataset.
        """
        size_ratio = 1 - split_ratio if df_type == 'train' else split_ratio
        description = f"Dataset: {df_type}, Split mode: {split_mode}, Size: {size_ratio}"
        dataset_creator = DerivedDatasetCreator(self.limits)
        try:
            new_dataset = dataset_creator.create_new_dataset(
                old_dataset=original_dataset,
                df=df,
                name=df_name,
                description=description,
                correlation_matrix=df.corr(numeric_only=True).round(
                    settings.ROUND_DECIMAL_PLACES).to_json(),
            )
        except DatasetExistsException:
            raise
        except IntegrityError:
            raise DatasetExistsException()
        return new_dataset
