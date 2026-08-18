import os
import uuid
import shutil
import tempfile
import cv2
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.pipeline.manager import run_pipeline
from backend.pipeline.fusion import DEFAULT_WEIGHTS

app = FastAPI(
    title="VeriSignal API",
    description="Multimodal Deepfake Detection & Authenticity Verification API",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = os.path.join(tempfile.gettempdir(), "verisignal_uploads")
os.makedirs(TEMP_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_DURATION_SECONDS = 35.0  # ~30s clip limit

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "VeriSignal Deepfake Reality Checker",
        "version": "1.0.0"
    }

@app.get("/api/weights")
def get_fusion_weights():
    return {"weights": DEFAULT_WEIGHTS}

@app.post("/api/analyze")
async def analyze_video(file: UploadFile = File(...)):
    # Validate file extension
    filename = file.filename or "uploaded_video.mp4"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".mp4", ".mov", ".avi", ".webm", ".mkv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Please upload MP4 or MOV video files."
        )

    # Save to temporary file
    temp_file_id = f"verisignal_{uuid.uuid4().hex}{ext}"
    temp_file_path = os.path.join(TEMP_DIR, temp_file_id)

    file_size = 0
    try:
        with open(temp_file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File size exceeds maximum allowed limit of 50 MB for demo clips."
                    )
                buffer.write(chunk)

        # Validate video duration using OpenCV
        cap = cv2.VideoCapture(temp_file_path)
        if not cap.isOpened():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to decode video file. File may be corrupted or unreadable."
            )

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_sec = frame_count / fps if fps > 0 else 0
        cap.release()

        if duration_sec > MAX_DURATION_SECONDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video duration ({duration_sec:.1f}s) exceeds the maximum demo limit of 30 seconds."
            )

        # Run pipeline asynchronously
        result = await run_pipeline(temp_file_path)
        
        # Attach duration metadata to response
        result["video_metadata"] = {
            "filename": filename,
            "duration_seconds": round(duration_sec, 1),
            "fps": round(fps, 1),
            "file_size_mb": round(file_size / (1024 * 1024), 2)
        }
        
        return JSONResponse(content=result)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing video: {str(e)}"
        )
    finally:
        # Cleanup temporary uploaded video (process and discard)
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

# Mount static frontend files if built dist directory exists (for single-container production deployment)
dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
if os.path.exists(dist_dir):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)

