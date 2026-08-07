from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include
from django.urls import path
from django.views.generic import TemplateView
from rest_framework.permissions import AllowAny
from rest_framework.schemas import get_schema_view

urlpatterns = [
    path('admin/', admin.site.urls),
    # swagger documentation
    path(
        'docs/openapi/',
        get_schema_view(
            title="Bugs Reporting Service",
            description="Service that allows users to report bugs they encounter.",
            version='1.0.0',
            public=True,
            permission_classes=(AllowAny,)
        ),
        name='openapi-schema'
    ),
    path(
        'docs/swagger-ui/',
        TemplateView.as_view(
            template_name='swagger-ui.html',
            extra_context={'schema_url': 'openapi-schema'}
        ),
        name='swagger-ui'
    ),
    # REST API
    path('', include('bug_reporting_service.api.urls')),
]
