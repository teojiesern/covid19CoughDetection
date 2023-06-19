from typing import Any
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import AudioInput
from django.apps import apps

import torchaudio
import torch
import librosa
import tempfile
import os
import numpy as np
import soundfile as sf
import io
import base64

class AudioInputView(APIView):
    def post(self, request, format=None):
        audio_blob = request.body
        model = apps.get_app_config('audio_input').model
        
        if audio_blob is None:
            return Response({'error': 'No audio blob provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # audio_input = AudioInput.objects.create(audio_file=audio_blob)

        audio_data = np.frombuffer(audio_blob, dtype=np.uint8)
        audio_data = audio_data.astype(np.int16)
        output_file = 'audio.wav'
        sf.write(output_file, audio_data, 44100)

        try:
            s, fs = librosa.load(output_file, sr=44100)
            if np.mean(s) == 0 or len(s) < 1024:
                raise ValueError()
            # waveform level amplitude normalization
            s = s / np.max(np.abs(s))

            # SAD
            sad_start_end_sil_length = int(100*1e-3*44100)
            sad_margin_length = int(50*1e-3*44100)
            sample_activity = np.zeros(s.shape)
            sample_activity[np.power(s,2)> 0.0001] = 1
            sad = np.zeros(s.shape)
            for i in range(sample_activity.shape[0]):
                if sample_activity[i] == 1: sad[i-sad_margin_length:i+sad_margin_length] = 1
            sad[0:sad_start_end_sil_length] = 0
            sad[-sad_start_end_sil_length:] = 0

            s = s[np.where(sad == 1)]

            #extract feature
            F_extractor = torchaudio.transforms.MelSpectrogram(sample_rate=44100,
														n_fft = 1024,
														n_mels = 64,
														f_max = 22050,
														hop_length = 441)
            F = F_extractor(torch.tensor(s))
            F = torchaudio.functional.amplitude_to_DB(F, multiplier=10, amin=1e-10, db_multiplier=0)
            FD = torchaudio.functional.compute_deltas(F)
            FD = torchaudio.functional.compute_deltas(F)
            FDD = torchaudio.functional.compute_deltas(FD)
            Fo = torch.cat((F,FD,FDD),dim=0)
            tensor = Fo.T.numpy()

            data = tensor.mean(axis=0)
            reshaped_data = np.resize(data, (128, 128))
        except ValueError:
            s = None
            return Response({'error': 'Something is wrong. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
        finally:
            result = model.predict(np.array([reshaped_data]))
        
        # Return the output as a response
        return Response({'output': result}, status=status.HTTP_200_OK)
