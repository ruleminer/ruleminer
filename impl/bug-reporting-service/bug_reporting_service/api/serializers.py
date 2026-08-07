from bug_reporting_service.api.models import BugReport
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class BugReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BugReport
        fields = ['description', 'screenshot', 'allow_contact']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'keycloak_id',
            'username',
            'email',
            'first_name',
            'last_name',
        ]


class BugReportSerializer(BugReportCreateSerializer):
    class Meta:
        model = BugReport
        fields = ['id', 'description', 'screenshot',
                  'allow_contact', 'author', 'created']
        read_only_fields = fields

    author = UserSerializer()
    screenshot = serializers.FileField(use_url=False)
