from typing import Dict, Any

# Named constants for base fusion weights (must sum to ~1.0)
# Easily adjustable baseline weights for multi-signal fusion scaffold
DEFAULT_WEIGHTS = {
    "visual": 0.40,
    "rppg": 0.35,
    "av_sync": 0.25
}

def fuse_signals(
    visual_res: Dict[str, Any],
    rppg_res: Dict[str, Any],
    av_sync_res: Dict[str, Any],
    custom_weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Fuses the three independent detection branch results into a unified probabilistic score.
    Applies confidence-weighted average so low-reading-confidence branches do not skew authenticity.
    """
    weights = custom_weights if custom_weights else DEFAULT_WEIGHTS

    v_score = visual_res.get("score", 50.0)
    v_conf = visual_res.get("reading_confidence", 0.0)

    r_score = rppg_res.get("score", 50.0)
    r_conf = rppg_res.get("reading_confidence", 0.0)

    a_score = av_sync_res.get("score", 0.0)
    a_conf = av_sync_res.get("reading_confidence", 0.0)

    # Compute confidence-weighted anomaly score
    weighted_sum = (
        weights["visual"] * v_conf * v_score +
        weights["rppg"] * r_conf * r_score +
        weights["av_sync"] * a_conf * a_score
    )

    weight_conf_denom = (
        weights["visual"] * v_conf +
        weights["rppg"] * r_conf +
        weights["av_sync"] * a_conf
    )

    if weight_conf_denom < 1e-4:
        synthetic_anomaly_score = 50.0
        overall_authenticity_score = 50.0
        classification = "Inconclusive"
        classification_key = "inconclusive"
    else:
        synthetic_anomaly_score = weighted_sum / weight_conf_denom
        overall_authenticity_score = float(round(100.0 - synthetic_anomaly_score, 1))

        if overall_authenticity_score >= 70.0:
            classification = "Likely Authentic"
            classification_key = "authentic"
        elif overall_authenticity_score >= 40.0:
            classification = "Inconclusive"
            classification_key = "inconclusive"
        else:
            classification = "Likely Synthetic"
            classification_key = "synthetic"

    # Synthesize plain-language summary of findings across branches
    flagged_branches = []
    if v_conf >= 0.3 and v_score >= 45.0:
        flagged_branches.append(f"Visual Forensics ({v_score:.0f}/100 anomaly)")
    if r_conf >= 0.3 and r_score >= 50.0:
        flagged_branches.append(f"rPPG Biosignals ({r_score:.0f}/100 anomaly)")
    if a_conf >= 0.3 and a_score >= 45.0:
        flagged_branches.append(f"AV-Sync ({a_score:.0f}/100 anomaly)")

    if not flagged_branches:
        if classification_key == "authentic":
            summary = "All active detection branches indicate high signal fidelity and consistency with natural human video."
        else:
            summary = "Reading confidences across detection branches were insufficient to form a definitive verdict."
    else:
        flags_str = ", ".join(flagged_branches)
        summary = f"Potential synthetic indicators flagged in: {flags_str}. Review individual branch cards for details."

    return {
        "overall_authenticity_score": overall_authenticity_score,
        "synthetic_anomaly_score": round(synthetic_anomaly_score, 1),
        "classification": classification,
        "classification_key": classification_key,
        "summary": summary,
        "weights_used": weights,
        "branch_breakdown": {
            "visual": {
                "score": v_score,
                "reading_confidence": v_conf,
                "explanation": visual_res.get("explanation", ""),
                "details": visual_res.get("details", {})
            },
            "rppg": {
                "score": r_score,
                "reading_confidence": r_conf,
                "explanation": rppg_res.get("explanation", ""),
                "heart_rate_bpm": rppg_res.get("heart_rate_bpm"),
                "snr_db": rppg_res.get("snr_db", 0.0),
                "phase_coherence": rppg_res.get("phase_coherence", 0.0),
                "pulse_trace": rppg_res.get("pulse_trace", []),
                "timestamps": rppg_res.get("timestamps", []),
                "details": rppg_res.get("details", {})
            },
            "av_sync": {
                "score": a_score,
                "reading_confidence": a_conf,
                "explanation": av_sync_res.get("explanation", ""),
                "offset_ms": av_sync_res.get("offset_ms", 0.0),
                "correlation": av_sync_res.get("correlation", 0.0),
                "has_speech": av_sync_res.get("has_speech", False),
                "lip_trace": av_sync_res.get("lip_trace", []),
                "audio_trace": av_sync_res.get("audio_trace", []),
                "timestamps": av_sync_res.get("timestamps", []),
                "details": av_sync_res.get("details", {})
            }
        }
    }
