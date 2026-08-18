import cv2
import numpy as np
import os
from typing import Dict, Any

_CASCADE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cascades")
_FACE_CASCADE_PATH = os.path.join(_CASCADE_DIR, "haarcascade_frontalface_default.xml")
if not os.path.exists(_FACE_CASCADE_PATH):
    _FACE_CASCADE_PATH = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")

def analyze_visual_forensics(video_path: str, max_samples: int = 60) -> Dict[str, Any]:
    """
    Analyzes video frames for visual deepfake artifacts:
    1. 2D FFT / DCT high-frequency spectral grid anomalies (GAN/Diffusion signatures)
    2. Face boundary blending inconsistencies & Laplacian variance differentials
    3. Chromatic channel noise irregularities in YCrCb space
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "score": 50.0,
            "reading_confidence": 0.0,
            "explanation": "Unable to open video stream for visual forensics.",
            "frame_scores": [],
            "details": {}
        }

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    if total_frames <= 0:
        cap.release()
        return {
            "score": 50.0,
            "reading_confidence": 0.0,
            "explanation": "Invalid video frame count.",
            "frame_scores": [],
            "details": {}
        }

    # Calculate sampling stride to process up to max_samples
    stride = max(1, total_frames // max_samples)
    frame_indices = list(range(0, total_frames, stride))[:max_samples]

    fft_anomalies = []
    boundary_mismatches = []
    chroma_noises = []
    frame_scores = []
    valid_frames_count = 0

    # Load bundled face cascade
    face_cascade = cv2.CascadeClassifier(_FACE_CASCADE_PATH)

    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret or frame is None:
            continue

        valid_frames_count += 1
        h, w, _ = frame.shape
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # 1. Frequency Domain FFT Analysis (2D Fourier Transform)
        dft = np.fft.fft2(gray.astype(float))
        dft_shift = np.fft.fftshift(dft)
        magnitude_spectrum = 20 * np.log(np.abs(dft_shift) + 1e-8)

        cy, cx = h // 2, w // 2
        r = min(h, w) // 6
        mask_low = np.zeros((h, w), dtype=bool)
        cv2.circle(mask_low, (cx, cy), r, True, -1)

        low_freq_energy = np.mean(magnitude_spectrum[mask_low])
        high_freq_energy = np.mean(magnitude_spectrum[~mask_low])
        freq_ratio = high_freq_energy / (low_freq_energy + 1e-5)

        # Deepfakes often display unnatural high-frequency energy ratio
        fft_anomaly = float(np.clip((freq_ratio - 0.25) * 200, 0, 100))
        fft_anomalies.append(fft_anomaly)

        # 2. Face Boundary Blur & Laplacian Inconsistency Analysis
        boundary_score = 15.0  # default baseline
        if not face_cascade.empty():
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            if len(faces) > 0:
                (x, y, fw, fh) = faces[0]
                face_roi = gray[y:y+fh, x:x+fw]
                bg_border = gray[max(0, y-20):y, max(0, x-20):x+fw+20]

                if face_roi.size > 0 and bg_border.size > 0:
                    lap_face = cv2.Laplacian(face_roi, cv2.CV_64F).var()
                    lap_bg = cv2.Laplacian(bg_border, cv2.CV_64F).var()
                    lap_ratio = max(lap_face, lap_bg) / (min(lap_face, lap_bg) + 1e-4)
                    if lap_ratio > 3.0:
                        boundary_score = float(np.clip((lap_ratio - 3.0) * 15 + 30, 0, 100))

        boundary_mismatches.append(boundary_score)

        # 3. YCrCb Color Space Chroma Artifacts
        ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
        cr_std = float(np.std(ycrcb[:, :, 1]))
        cb_std = float(np.std(ycrcb[:, :, 2]))
        chroma_diff = abs(cr_std - cb_std)
        chroma_score = float(np.clip(chroma_diff * 4, 0, 100))
        chroma_noises.append(chroma_score)

        # Per-frame composite anomaly score
        frame_anomaly = 0.45 * fft_anomaly + 0.35 * boundary_score + 0.20 * chroma_score
        frame_scores.append(round(frame_anomaly, 2))

    cap.release()

    if valid_frames_count == 0:
        return {
            "score": 50.0,
            "reading_confidence": 0.0,
            "explanation": "No readable frames found in clip.",
            "frame_scores": [],
            "details": {}
        }

    avg_fft = float(np.mean(fft_anomalies))
    avg_boundary = float(np.mean(boundary_mismatches))
    avg_chroma = float(np.mean(chroma_noises))

    overall_anomaly_score = float(round(0.45 * avg_fft + 0.35 * avg_boundary + 0.20 * avg_chroma, 1))

    reading_confidence = min(1.0, float(round(valid_frames_count / max_samples, 2)))

    explanations = []
    if avg_fft > 45.0:
        explanations.append(f"Unnatural high-frequency spectral artifacts detected (FFT index: {avg_fft:.1f}/100).")
    if avg_boundary > 40.0:
        explanations.append(f"Boundary blending and sharpness mismatch observed around facial ROI ({avg_boundary:.1f}/100).")
    if avg_chroma > 45.0:
        explanations.append(f"Irregular color compression noise in YCrCb chroma channels ({avg_chroma:.1f}/100).")

    if not explanations:
        explanation = "Visual frame spectra, spatial gradients, and chroma consistency appear consistent with natural video."
    else:
        explanation = " ".join(explanations)

    return {
        "score": overall_anomaly_score,
        "reading_confidence": reading_confidence,
        "explanation": explanation,
        "frame_scores": frame_scores,
        "details": {
            "fft_spectral_anomaly": round(avg_fft, 1),
            "boundary_mismatch": round(avg_boundary, 1),
            "chroma_noise_anomaly": round(avg_chroma, 1),
            "sampled_frames": valid_frames_count
        }
    }
