from django.contrib import admin
from rolap.api.models.algorithms.questions import Answer
from rolap.api.models.algorithms.questions import Question
from rolap.api.models.datasets import Dataset
from rolap.api.models.projects import Project

admin.site.register(Project)
admin.site.register(Dataset)
admin.site.register(Question)
admin.site.register(Answer)
