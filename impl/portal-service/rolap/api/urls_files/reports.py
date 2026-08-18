from django.urls import path
from rolap.api.views.reports import ModifyReportView
from rolap.api.views.reports import ReportMetadataView
from rolap.api.views.reports import ReportsDisplaySFTPView
from rolap.api.views.reports import ReportSpecificationView


urlpatterns = [
    path('reports/<int:report_id>',
         ReportsDisplaySFTPView.as_view(), name='report_display'),
    path('reports/<int:report_id>/meta',
         ReportMetadataView.as_view(), name='report_metadata'),
    path('reports/<int:report_id>/modify',
         ModifyReportView.as_view(), name='modify_report'),
    path('datasets/<int:dataset_id>/report_specification',
         ReportSpecificationView.as_view(), name='report_specification'),
]
