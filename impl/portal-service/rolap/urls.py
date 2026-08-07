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
            title="ROLAP",
            description="ROLAP REST API",
            version='1.1.1',
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
    path('auth/', include('keycloak_auth.urls')),
    path('api/', include('rolap.api.urls')),
    path('manage/', include('rolap.api.urls_files.manage')),
    path('calculate/', include('rolap.api.urls_calc')),
    path('api/stripe/', include('rolap.stripe_payments.urls')),
]
