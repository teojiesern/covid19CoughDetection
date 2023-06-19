from django.urls import path
from .views import AudioInputView

urlpatterns = [
    path('api/audio-input/', AudioInputView.as_view(), name='audio_input'),
]
