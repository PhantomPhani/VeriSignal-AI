import os
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
import scipy.signal as signal

_CASCADE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cascades")
_FACE_CASCADE_PATH = os.path.join(_CASCADE_DIR, "haarcascade_frontalface_default.xml")
if not os.path.exists(_FACE_CASCADE_PATH):
    _FACE_CASCADE_PATH = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")

def analyze_av_sync(video_path: str) -> Dict[str, Any]:
    """
    Analyzes Audio-Visual Phoneme-to-Viseme synchronization:
    1. Extracts mouth opening aperture trajectory over time.
    2. Extracts audio envelope / spectral energy via moviepy / librosa / scipy.
    3. Scores phoneme-to-viseme timing correlation; flags persistent lag/lead beyond plausible human range.
    4. Handles non-audio or non-speech clips gracefully (N/A state with reading_confidence = 0.0).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return _na_response("Unable to open video stream.")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames < 15:
        cap.release()
        return _na_response("Video clip too short for audio-visual sync analysis.")

    face_cascade = cv2.CascadeClassifier(_FACE_CASCADE_PATH)

    lip_aperture = []
    timestamps = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        timestamps.append(round(frame_idx / fps, 2))
        frame_idx += 1
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = []
        if not face_cascade.empty():
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)

        if len(faces) > 0:
            (x, y, w, h) = faces[0]
            mouth_roi = gray[y + int(0.55 * h):y + h, x + int(0.15 * w):x + int(0.85 * w)]
            if mouth_roi.size > 0:
                sobely = cv2.Sobel(mouth_roi, cv2.CV_64F, 0, 1, ksize=3)
                aperture_val = float(np.mean(np.abs(sobely)))
            else:
                aperture_val = 0.0
        else:
            aperture_val = lip_aperture[-1] if lip_aperture else 0.0

        lip_aperture.append(aperture_val)

    cap.release()

    # Extract audio energy
    audio_energy, has_audio = _extract_audio_energy(video_path, fps, len(timestamps))

    if not has_audio or audio_energy is None or np.max(audio_energy) < 1e-4:
        return _na_response("N/A — no speech or audio track detected.")

    # Normalize
    lip_aperture_norm = signal.detrend(np.array(lip_aperture))
    if np.std(lip_aperture_norm) > 1e-4:
        lip_aperture_norm /= np.std(lip_aperture_norm)

    audio_energy_norm = signal.detrend(np.array(audio_energy))
    if np.std(audio_energy_norm) > 1e-4:
        audio_energy_norm /= np.std(audio_energy_norm)

    # Cross-Correlation
    corr = signal.correlate(lip_aperture_norm, audio_energy_norm, mode='full')
    lags = signal.correlation_lags(len(lip_aperture_norm), len(audio_energy_norm), mode='full')

    max_corr_idx = np.argmax(corr)
    peak_lag_frames = lags[max_corr_idx]
    peak_offset_ms = float(round((peak_lag_frames / fps) * 1000, 1))

    norm_factor = np.sqrt(np.sum(lip_aperture_norm**2) * np.sum(audio_energy_norm**2) + 1e-8)
    max_correlation = float(round(corr[max_corr_idx] / norm_factor, 2))

    # Sync Anomaly Score
    abs_offset = abs(peak_offset_ms)
    sync_anomaly_score = 10.0
    if abs_offset > 100.0:
        sync_anomaly_score += min(60.0, (abs_offset - 100.0) * 0.4)
    if max_correlation < 0.25:
        sync_anomaly_score += (0.25 - max_correlation) * 120.0

    sync_anomaly_score = float(round(np.clip(sync_anomaly_score, 0.0, 100.0), 1))
    reading_confidence = float(round(min(1.0, max(0.4, max_correlation + 0.3)), 2))

    # Downsample for visualization
    step = max(1, len(timestamps) // 100)
    lip_samples = [round(float(v), 3) for v in lip_aperture_norm[::step]]
    audio_samples = [round(float(v), 3) for v in audio_energy_norm[::step]]
    time_samples = [round(float(t), 2) for t in timestamps[::step]]

    if abs_offset > 150.0 or max_correlation < 0.2:
        explanation = f"Audio-visual desynchronization detected: {peak_offset_ms:+.0f} ms lip-speech offset (correlation: {max_correlation:.2f})."
    else:
        explanation = f"Phoneme-to-viseme lip alignment is consistent with audio speech track (offset: {peak_offset_ms:+.0f} ms, correlation: {max_correlation:.2f})."

    return {
        "score": sync_anomaly_score,
        "reading_confidence": reading_confidence,
        "explanation": explanation,
        "offset_ms": peak_offset_ms,
        "correlation": max_correlation,
        "has_speech": True,
        "lip_trace": lip_samples,
        "audio_trace": audio_samples,
        "timestamps": time_samples,
        "details": {
            "lag_frames": int(peak_lag_frames),
            "max_correlation": max_correlation
        }
    }


def _extract_audio_energy(video_path: str, video_fps: float, target_length: int) -> Tuple[Optional[np.ndarray], bool]:
    """Attempts audio extraction using MoviePy."""
    try:
        from moviepy.editor import VideoFileClip
        clip = VideoFileClip(video_path)
        if clip.audio is None:
            clip.close()
            return None, False

        sr = 16000
        audio_array = clip.audio.to_soundarray(fps=sr)
        clip.close()

        if audio_array is None or len(audio_array) == 0:
            return None, False

        if audio_array.ndim > 1:
            audio_array = np.mean(audio_array, axis=1)

        samples_per_frame = int(sr / video_fps)
        energy_per_frame = []
        for i in range(target_length):
            start = i * samples_per_frame
            end = min(len(audio_array), (i + 1) * samples_per_frame)
            if start >= len(audio_array):
                energy_per_frame.append(0.0)
            else:
                chunk = audio_array[start:end]
                energy_per_frame.append(float(np.sqrt(np.mean(chunk**2))))

        return np.array(energy_per_frame), True
    except Exception:
        return None, False


def _na_response(msg: str) -> Dict[str, Any]:
    return {
        "score": 0.0,
        "reading_confidence": 0.0,
        "explanation": msg,
        "offset_ms": 0.0,
        "correlation": 0.0,
        "has_speech": False,
        "lip_trace": [],
        "audio_trace": [],
        "timestamps": [],
        "details": {}
    }
