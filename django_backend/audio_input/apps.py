from django.apps import AppConfig
from .model_loader import load_model

class YourAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audio_input'

    def ready(self):
        self.model = load_model()
