from django.urls import path
from rolap.api.views.tasks import AbortTaskView
from rolap.api.views.tasks import StopTaskView
from rolap.api.views.tasks import TaskDetailView
from rolap.api.views.tasks import TaskStatusWorkerView
from rolap.api.views.tasks import TasksView

urlpatterns = [
    path('tasks/<int:task_id>',
         TaskDetailView.as_view(), name="task-detail"),
    path('tasks/project/<int:project_id>',
         TasksView.as_view(), name="task-list"),
    path('tasks/<int:task_id>/abort',
         AbortTaskView.as_view(), name="task-abort"),
    path('tasks/<int:task_id>/stop',
         StopTaskView.as_view(), name="task-stop"),
    path('tasks/<int:task_id>/status',
         TaskStatusWorkerView.as_view(), name="task-status"),
]
