from django.conf import settings
from rest_framework.response import Response
from rest_framework.schemas.openapi import AutoSchema
from rest_framework.serializers import CharField
from rest_framework.serializers import ListSerializer
from rest_framework.views import APIView


class CodecsListView(APIView):
    class _CustomSchema(AutoSchema):

        def get_tags(self, path, method):
            return ['datasets']

        def get_response_serializer(self, path, method):
            return ListSerializer(child=CharField())

        def get_request_serializer(self, path, method):
            return None

    schema = _CustomSchema(operation_id_base="available_codecs")

    def get(self, request):
        return Response(settings.ALLOWED_CODECS)
