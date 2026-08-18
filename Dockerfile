# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Python Backend + Static Asset Server
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies required for OpenCV, OpenCV video decoding, and audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application backend code
COPY backend ./backend
COPY scripts ./scripts

# Copy built frontend assets from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8000
EXPOSE 8000

# Run FastAPI production server
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
