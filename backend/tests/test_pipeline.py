import pytest
import os
import numpy as np
from fastapi.testclient import TestClient

from backend.pipeline.visual_forensics import analyze_visual_forensics
from backend.pipeline.rppg_biosignal import analyze_rppg_biosignal
from backend.pipeline.av_sync import analyze_av_sync
from backend.pipeline.fusion import fuse_signals, DEFAULT_WEIGHTS
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "VeriSignal" in data["service"]

def test_fusion_layer_authentic():
    v_res = {"score": 10.0, "reading_confidence": 0.9, "explanation": "Clean"}
    r_res = {"score": 15.0, "reading_confidence": 0.85, "explanation": "Normal HR"}
    a_res = {"score": 5.0, "reading_confidence": 0.8, "explanation": "Good sync"}
    
    fused = fuse_signals(v_res, r_res, a_res)
    assert fused["overall_authenticity_score"] > 80.0
    assert fused["classification_key"] == "authentic"
    assert fused["classification"] == "Likely Authentic"

def test_fusion_layer_low_confidence_handling():
    v_res = {"score": 10.0, "reading_confidence": 0.9, "explanation": "Clean"}
    r_res = {"score": 90.0, "reading_confidence": 0.05, "explanation": "Bad lighting"}
    a_res = {"score": 10.0, "reading_confidence": 0.85, "explanation": "Synced"}
    
    fused = fuse_signals(v_res, r_res, a_res)
    assert fused["overall_authenticity_score"] >= 70.0
    assert fused["classification_key"] == "authentic"

def test_fusion_layer_synthetic():
    v_res = {"score": 85.0, "reading_confidence": 0.9, "explanation": "GAN artifacts"}
    r_res = {"score": 90.0, "reading_confidence": 0.8, "explanation": "Flat pulse"}
    a_res = {"score": 75.0, "reading_confidence": 0.8, "explanation": "Lip desync"}
    
    fused = fuse_signals(v_res, r_res, a_res)
    assert fused["overall_authenticity_score"] < 40.0
    assert fused["classification_key"] == "synthetic"
    assert fused["classification"] == "Likely Synthetic"

def test_av_sync_na_handling():
    a_res = analyze_av_sync("non_existent_file.mp4")
    assert a_res["has_speech"] is False
    assert a_res["reading_confidence"] == 0.0
    assert "N/A" in a_res["explanation"] or "Unable" in a_res["explanation"]

def test_e2e_video_analysis():
    sample_file = os.path.join("samples", "sample_authentic.mp4")
    assert os.path.exists(sample_file), "Sample video file must exist"
    
    with open(sample_file, "rb") as f:
        response = client.post("/api/analyze", files={"file": ("sample_authentic.mp4", f, "video/mp4")})
        
    assert response.status_code == 200
    data = response.json()
    assert "overall_authenticity_score" in data
    assert "classification" in data
    assert "branch_breakdown" in data
    assert "visual" in data["branch_breakdown"]
    assert "rppg" in data["branch_breakdown"]
    assert "av_sync" in data["branch_breakdown"]
