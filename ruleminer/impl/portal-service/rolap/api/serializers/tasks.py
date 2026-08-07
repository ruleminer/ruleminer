from rest_framework import serializers
from rolap.api.models.tasks import Task
from rolap.api.serializers.content_type import ContentTypeSerializer


class TaskDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = (
            "task_id", "project", "inner_id", "type", "status", "error_cause", "meta",
            "create_timestamp", "start_timestamp", "finish_timestamp", "execution_time",
            "source_content_type", "source_object_id",
            "result_content_type", "result_object_id",
        )

    execution_time = serializers.ReadOnlyField()
    source_content_type = ContentTypeSerializer()
    result_content_type = ContentTypeSerializer()


class TaskListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = (
            "task_id", "project", "inner_id", "type", "status",
            "create_timestamp", "start_timestamp", "finish_timestamp", "execution_time",
            "source_content_type", "source_object_id",
            "result_content_type", "result_object_id",
        )

    execution_time = serializers.ReadOnlyField()
    source_content_type = ContentTypeSerializer()
    result_content_type = ContentTypeSerializer()


class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ("status", "error_cause", "meta", )
        extra_kwargs = {
            "status": {
                "required": False,
            },
            "error_cause": {
                "required": False,
            },
            "meta": {
                "required": False,
            },
        }

    def save(self, **kwargs):
        meta = self.validated_data.pop("meta", {})
        instance = super().save(**kwargs)
        instance.meta.update(meta)
        instance.save()
        return instance


class TaskResponseSerializer(serializers.ModelSerializer):
    task_id = serializers.IntegerField(source="pk")

    class Meta:
        model = Task
        fields = ("task_id", )
