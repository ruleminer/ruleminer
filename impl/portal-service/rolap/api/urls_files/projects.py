from django.urls import path
from rolap.api.views.projects import CreateExampleProjectView
from rolap.api.views.projects import CreateProjectAndUploadDatasetView
from rolap.api.views.projects import DeleteMultipleDatasetsView
from rolap.api.views.projects import DeleteMultipleProjectsView
from rolap.api.views.projects import ProjectDetailView
from rolap.api.views.projects import ProjectListCreateView
from rolap.api.views.projects import ProjectMatchingDatasetsView
from rolap.api.views.projects import ProjectSizeDetailView
from rolap.api.views.projects import ProjectSizeListView
from rolap.api.views.projects import ProjectTreeView


urlpatterns = [
    path('projects', ProjectListCreateView.as_view(), name='projects'),
    path('projects/create_and_upload', CreateProjectAndUploadDatasetView.as_view(),
         name='create-project-and-upload-dataset'),
    path('projects/<int:id>', ProjectDetailView.as_view(), name="project-detail"),
    path('projects/<int:id>/tree',
         ProjectTreeView.as_view(), name="project-tree"),
    path('projects/<int:id>/matching_datasets',
         ProjectMatchingDatasetsView.as_view(), name="project-matching-datasets"),
    path('projects/size',
         ProjectSizeListView.as_view(), name="project-size-list"),
    path('projects/<int:id>/size',
         ProjectSizeDetailView.as_view(), name="project-size-detail"),
    path('projects/<int:id>/delete_datasets',
         DeleteMultipleDatasetsView.as_view(), name="project-delete-multiple-datasets"),
    path('projects/delete_projects',
         DeleteMultipleProjectsView.as_view(), name="project-delete-multiple-projects"),
    path('projects/create_example_project',
         CreateExampleProjectView.as_view(), name="project-create-example-projects"),
]
