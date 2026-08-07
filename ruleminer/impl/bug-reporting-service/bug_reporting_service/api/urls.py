from bug_reporting_service.api.views import BugReportScreenshotView
from bug_reporting_service.api.views import ReportBugView
from django.urls import path

urlpatterns = [
    path(
        'reports',
        ReportBugView.as_view(),
        name="report-bug"
    ),
    path(
        'screenshots/<int:pk>',
        BugReportScreenshotView.as_view(),
        name="preview-bug-report-screenshot"
    ),
]
