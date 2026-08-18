import os
import cv2
import numpy as np

def generate_sample_clips(output_dir: str = "samples"):
    """
    Generates realistic synthetic test MP4 video clips for automated and manual verification.
    - sample_authentic.mp4: Smooth facial oval, physiological 1.2 Hz pulse simulation, synced motion.
    - sample_synthetic.mp4: Boundary sharpness mismatch, high-frequency grid artifacts, lip lag offset.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    fps = 30
    duration_sec = 4
    num_frames = fps * duration_sec
    w, h = 640, 480
    
    # 1. Generate Authentic Simulation Clip
    path_auth = os.path.join(output_dir, "sample_authentic.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(path_auth, fourcc, fps, (w, h))
    
    for i in range(num_frames):
        t = i / fps
        frame = np.ones((h, w, 3), dtype=np.uint8) * 30  # Dark background
        
        # Draw natural head oval
        cx, cy = 320, 240 + int(np.sin(t * 2) * 5)
        # Skin color with subtle 1.2 Hz (72 BPM) rPPG green channel pulsation
        g_pulse = int(140 + np.sin(2 * np.pi * 1.2 * t) * 8)
        skin_color = (120, g_pulse, 210)  # BGR
        
        cv2.ellipse(frame, (cx, cy), (100, 130), 0, 0, 360, skin_color, -1)
        
        # Eyes
        cv2.circle(frame, (cx - 35, cy - 30), 12, (255, 255, 255), -1)
        cv2.circle(frame, (cx + 35, cy - 30), 12, (255, 255, 255), -1)
        cv2.circle(frame, (cx - 35, cy - 30), 5, (50, 50, 50), -1)
        cv2.circle(frame, (cx + 35, cy - 30), 5, (50, 50, 50), -1)
        
        # Mouth moving in sync with t
        mouth_open = int(5 + np.abs(np.sin(t * 6)) * 15)
        cv2.ellipse(frame, (cx, cy + 50), (25, mouth_open), 0, 0, 360, (40, 40, 180), -1)
        
        out.write(frame)
    out.release()

    # 2. Generate Synthetic Deepfake Glitch Simulation Clip
    path_synth = os.path.join(output_dir, "sample_synthetic.mp4")
    out_synth = cv2.VideoWriter(path_synth, fourcc, fps, (w, h))
    
    for i in range(num_frames):
        t = i / fps
        frame = np.ones((h, w, 3), dtype=np.uint8) * 30
        
        # Head ROI
        cx, cy = 320, 240
        
        # Flat constant green channel (no rPPG pulse)
        skin_color = (110, 135, 205)
        cv2.ellipse(frame, (cx, cy), (100, 130), 0, 0, 360, skin_color, -1)
        
        # Boundary blur / Laplacian inconsistency around face edge (glitch ring)
        cv2.ellipse(frame, (cx, cy), (105, 135), 0, 0, 360, (0, 255, 255), 2)
        
        # High-frequency grid artifact overlay (simulating GAN/Diffusion spectral noise)
        grid_slice = (np.sin(np.linspace(0, 50*np.pi, 160)) > 0).astype(np.uint8) * 40
        grid_2d = np.tile(grid_slice, (200, 1))
        frame[cy-100:cy+100, cx-80:cx+80, 0] = cv2.add(frame[cy-100:cy+100, cx-80:cx+80, 0], grid_2d)
        
        # Desynced mouth movement
        mouth_open = int(5 + np.abs(np.sin(t * 1.5)) * 18)
        cv2.ellipse(frame, (cx, cy + 50), (25, mouth_open), 0, 0, 360, (30, 30, 170), -1)
        
        out_synth.write(frame)
    out_synth.release()

    print(f"Generated sample clips successfully:\n - {path_auth}\n - {path_synth}")

if __name__ == "__main__":
    generate_sample_clips()
