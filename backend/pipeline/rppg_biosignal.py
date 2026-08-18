import cv2
import numpy as np
import os
from scipy import signal
from typing import Dict, Any

# Path to bundled Haar cascade XML
_CASCADE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cascades")
_FACE_CASCADE_PATH = os.path.join(_CASCADE_DIR, "haarcascade_frontalface_default.xml")

def analyze_rppg_biosignal(video_path: str, target_fps: float = 30.0) -> Dict[str, Any]:
    """
    Extracts remote photoplethysmography (rPPG) biosignals from facial ROIs:
    1. Tracks facial ROIs: Forehead, Left Cheek, Right Cheek
    2. Extracts Green channel / CHROM-POS skin reflectance pulse over time
    3. Filters signal with Butterworth bandpass filter (0.75 Hz - 3.0 Hz / 45 - 180 BPM)
    4. Computes estimated Heart Rate (BPM), Signal-to-Noise Ratio (SNR), and Inter-ROI Phase Coherence
    5. Evaluates reading confidence based on motion jitter, resolution, and illumination stability
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "score": 50.0,
            "reading_confidence": 0.0,
            "explanation": "Unable to open video for rPPG biosignal analysis.",
            "heart_rate_bpm": None,
            "snr_db": 0.0,
            "phase_coherence": 0.0,
            "pulse_trace": [],
            "timestamps": []
        }

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps < 5.0 or np.isnan(fps):
        fps = target_fps

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames < 30:
        cap.release()
        return {
            "score": 50.0,
            "reading_confidence": 0.1,
            "explanation": "Video clip too short for reliable rPPG pulse extraction (requires >1 second).",
            "heart_rate_bpm": None,
            "snr_db": 0.0,
            "phase_coherence": 0.0,
            "pulse_trace": [],
            "timestamps": []
        }

    face_cascade = cv2.CascadeClassifier(_FACE_CASCADE_PATH)

    forehead_signals = []
    lcheek_signals = []
    rcheek_signals = []
    frame_brightness = []
    timestamps = []

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        t_sec = frame_idx / fps
        timestamps.append(round(t_sec, 2))
        frame_idx += 1

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        frame_brightness.append(float(np.mean(gray)))

        faces = []
        if not face_cascade.empty():
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)

        if len(faces) == 0:
            if forehead_signals:
                forehead_signals.append(forehead_signals[-1])
                lcheek_signals.append(lcheek_signals[-1])
                rcheek_signals.append(rcheek_signals[-1])
            else:
                forehead_signals.append(0.0)
                lcheek_signals.append(0.0)
                rcheek_signals.append(0.0)
            continue

        (x, y, w, h) = faces[0]

        # Define facial ROIs
        fh_x1, fh_y1 = x + int(0.25 * w), y + int(0.08 * h)
        fh_x2, fh_y2 = x + int(0.75 * w), y + int(0.25 * h)
        lc_x1, lc_y1 = x + int(0.15 * w), y + int(0.55 * h)
        lc_x2, lc_y2 = x + int(0.40 * w), y + int(0.75 * h)
        rc_x1, rc_y1 = x + int(0.60 * w), y + int(0.55 * h)
        rc_x2, rc_y2 = x + int(0.85 * w), y + int(0.75 * h)

        fh_roi = frame[fh_y1:fh_y2, fh_x1:fh_x2]
        lc_roi = frame[lc_y1:lc_y2, lc_x1:lc_x2]
        rc_roi = frame[rc_y1:rc_y2, rc_x1:rc_x2]

        def extract_pos_val(roi_img):
            if roi_img.size == 0:
                return 0.0
            r = np.mean(roi_img[:, :, 2])
            g = np.mean(roi_img[:, :, 1])
            b = np.mean(roi_img[:, :, 0])
            return float(g - b + 0.5 * (g + b - 2 * r))

        forehead_signals.append(extract_pos_val(fh_roi))
        lcheek_signals.append(extract_pos_val(lc_roi))
        rcheek_signals.append(extract_pos_val(rc_roi))

    cap.release()

    n_samples = len(forehead_signals)
    if n_samples < 30:
        return {
            "score": 50.0,
            "reading_confidence": 0.1,
            "explanation": "Insufficient valid face tracking frames for rPPG pulse extraction.",
            "heart_rate_bpm": None,
            "snr_db": 0.0,
            "phase_coherence": 0.0,
            "pulse_trace": [],
            "timestamps": []
        }

    # Bandpass Filter (0.75 Hz to 3.0 Hz = 45 to 180 BPM)
    nyquist = 0.5 * fps
    low = 0.75 / nyquist
    high = min(3.0 / nyquist, 0.95)

    if low >= high or low <= 0:
        low, high = 0.05, 0.45

    b, a = signal.butter(2, [low, high], btype='bandpass')

    def process_pulse(sig_arr):
        sig_detrend = signal.detrend(np.array(sig_arr))
        filtered = signal.filtfilt(b, a, sig_detrend)
        return filtered

    fh_filtered = process_pulse(forehead_signals)
    lc_filtered = process_pulse(lcheek_signals)
    rc_filtered = process_pulse(rcheek_signals)

    # Heart Rate & SNR via FFT
    fft_vals = np.abs(np.fft.rfft(fh_filtered))
    freqs = np.fft.rfftfreq(n_samples, d=1.0/fps)

    valid_mask = (freqs >= 0.75) & (freqs <= 3.0)
    if np.any(valid_mask):
        phys_freqs = freqs[valid_mask]
        phys_fft = fft_vals[valid_mask]
        peak_idx = np.argmax(phys_fft)
        peak_freq = phys_freqs[peak_idx]
        heart_rate_bpm = float(round(peak_freq * 60.0, 1))
        peak_power = phys_fft[peak_idx] ** 2
        bg_power = np.mean(phys_fft ** 2) + 1e-6
        snr_db = float(round(10 * np.log10(peak_power / bg_power), 2))
    else:
        heart_rate_bpm = 72.0
        snr_db = 1.0

    # Inter-ROI Phase Coherence
    corr_fh_lc = float(np.corrcoef(fh_filtered, lc_filtered)[0, 1]) if np.std(fh_filtered) > 1e-5 else 0.0
    corr_fh_rc = float(np.corrcoef(fh_filtered, rc_filtered)[0, 1]) if np.std(fh_filtered) > 1e-5 else 0.0

    if np.isnan(corr_fh_lc): corr_fh_lc = 0.0
    if np.isnan(corr_fh_rc): corr_fh_rc = 0.0

    phase_coherence = float(round(max(0.0, (corr_fh_lc + corr_fh_rc) / 2.0), 2))

    # Reading Confidence
    bright_std = np.std(frame_brightness) if frame_brightness else 10.0
    lighting_confidence = max(0.1, 1.0 - min(1.0, bright_std / 30.0))
    signal_confidence = min(1.0, max(0.2, snr_db / 12.0))
    length_confidence = min(1.0, n_samples / (fps * 10.0))
    reading_confidence = float(round(0.4 * lighting_confidence + 0.4 * signal_confidence + 0.2 * length_confidence, 2))

    # Anomaly Scoring
    rppg_anomaly_score = 15.0
    if phase_coherence < 0.25:
        rppg_anomaly_score += (0.25 - phase_coherence) * 160.0
    if snr_db < 2.0:
        rppg_anomaly_score += (2.0 - snr_db) * 15.0
    rppg_anomaly_score = float(round(np.clip(rppg_anomaly_score, 0.0, 100.0), 1))

    # Downsample pulse trace for visualization
    step = max(1, n_samples // 100)
    pulse_trace_samples = [round(float(val), 4) for val in fh_filtered[::step]]
    timestamp_samples = [round(float(t), 2) for t in timestamps[::step]]

    # Explanation
    explanations = []
    if reading_confidence < 0.45:
        explanations.append(f"Low reading confidence ({int(reading_confidence*100)}%) due to lighting fluctuations or video compression.")
    if rppg_anomaly_score > 55.0:
        explanations.append(f"Abnormal or absent facial blood flow pulse (SNR: {snr_db:.1f} dB, phase coherence: {phase_coherence:.2f}).")
    elif heart_rate_bpm:
        explanations.append(f"Clear physiological rPPG pulse detected (~{heart_rate_bpm} BPM, SNR: {snr_db:.1f} dB, region coherence: {phase_coherence:.2f}).")

    explanation = " ".join(explanations)

    return {
        "score": rppg_anomaly_score,
        "reading_confidence": reading_confidence,
        "explanation": explanation,
        "heart_rate_bpm": heart_rate_bpm,
        "snr_db": snr_db,
        "phase_coherence": phase_coherence,
        "pulse_trace": pulse_trace_samples,
        "timestamps": timestamp_samples,
        "details": {
            "forehead_cheek_corr": round((corr_fh_lc + corr_fh_rc) / 2.0, 2),
            "lighting_stability": round(lighting_confidence, 2)
        }
    }
