import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, Callable
from .visual_forensics import analyze_visual_forensics
from .rppg_biosignal import analyze_rppg_biosignal
from .av_sync import analyze_av_sync
from .fusion import fuse_signals

executor = ThreadPoolExecutor(max_workers=4)

async def run_pipeline(video_path: str, progress_callback: Callable[[str, float], None] = None) -> Dict[str, Any]:
    """
    Executes the visual, rPPG, and AV-sync branches in parallel threads,
    reporting stage progress, and fuses the results.
    """
    loop = asyncio.get_running_loop()
    
    if progress_callback:
        progress_callback("started", 10.0)

    # Launch branch 1: Visual Forensics
    v_task = loop.run_in_executor(executor, analyze_visual_forensics, video_path)
    
    # Launch branch 2: rPPG Biosignals
    r_task = loop.run_in_executor(executor, analyze_rppg_biosignal, video_path)
    
    # Launch branch 3: Audio-Visual Sync
    a_task = loop.run_in_executor(executor, analyze_av_sync, video_path)
    
    # Gather results concurrently
    v_res, r_res, a_res = await asyncio.gather(v_task, r_task, a_task, return_exceptions=True)

    # Handle exceptions gracefully per branch
    if isinstance(v_res, Exception):
        v_res = {
            "score": 50.0, "reading_confidence": 0.0,
            "explanation": f"Visual forensics branch error: {str(v_res)}",
            "frame_scores": [], "details": {}
        }

    if isinstance(r_res, Exception):
        r_res = {
            "score": 50.0, "reading_confidence": 0.0,
            "explanation": f"rPPG biosignal branch error: {str(r_res)}",
            "heart_rate_bpm": None, "snr_db": 0.0, "phase_coherence": 0.0,
            "pulse_trace": [], "timestamps": [], "details": {}
        }

    if isinstance(a_res, Exception):
        a_res = {
            "score": 0.0, "reading_confidence": 0.0,
            "explanation": f"AV-sync branch error: {str(a_res)}",
            "offset_ms": 0.0, "correlation": 0.0, "has_speech": False,
            "lip_trace": [], "audio_trace": [], "timestamps": [], "details": {}
        }

    if progress_callback:
        progress_callback("fusing", 90.0)

    # Fuse branch outputs
    fusion_result = fuse_signals(v_res, r_res, a_res)

    if progress_callback:
        progress_callback("completed", 100.0)

    return fusion_result
