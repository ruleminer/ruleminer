from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rolap.api'

    def ready(self):
        from rolap.api.signals import detach_task
        from rolap.api.signals import update_project_updated_at
        from rolap.api.signals import dataset_pre_delete_handler
        from rolap.api.signals import project_pre_delete_handler
