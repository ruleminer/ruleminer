from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.views import APIView
from rolap.api.permissions import IsRolapUser
from rolap.api.serializers.limits import UserLimitSerializer
from rolap.api.utils.limits import UserLimits


class UserLimitView(APIView):
    class _CustomSchema(AutoSchema):
        def get_tags(self, path, method):
            return ["user_limits"]

        def get_request_serializer(self, path, method):
            return None

        def get_response_serializer(self, path, method):
            return UserLimitSerializer()

    schema = _CustomSchema(operation_id_base="user_limits")
    permission_classes = [IsRolapUser]

    def get(self, request):
        user = request.user
        limits = UserLimits(user)
        serializer = UserLimitSerializer(limits)
        return Response(serializer.data)
