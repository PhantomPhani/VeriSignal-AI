import subprocess
import sys
import os
import time

def main():
    print("=" * 60)
    print(" VeriSignal — Multimodal Deepfake Reality Checker Launcher")
    print("=" * 60)

    # 1. Start Backend FastAPI Server
    print("[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"]
    backend_process = subprocess.Popen(backend_cmd)

    time.sleep(2)

    # 2. Start Frontend Vite Dev Server
    print("[2/2] Starting Vite React Frontend on http://localhost:5173 ...")
    frontend_cmd = ["npx.cmd" if os.name == "nt" else "npx", "vite", "--port", "5173"]
    frontend_process = subprocess.Popen(frontend_cmd)

    print("\n" + "=" * 60)
    print(" VeriSignal Local Deployment Ready!")
    print(" - App UI:     http://localhost:5173")
    print(" - Backend:    http://127.0.0.1:8000")
    print(" - API Docs:   http://127.0.0.1:8000/docs")
    print(" Press Ctrl+C to stop all servers.")
    print("=" * 60 + "\n")

    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("VeriSignal servers stopped cleanly.")

if __name__ == "__main__":
    main()
