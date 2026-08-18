import React, { useState, useRef } from 'react';
import { UploadCloud, Film, AlertTriangle, CheckCircle2, Play, Sparkles } from 'lucide-react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onUseSampleVideo?: () => void;
  error?: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected, onUseSampleVideo, error }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setValidationError(null);

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) {
      setValidationError('Unsupported video format. Please select an MP4 or MOV video file.');
      return;
    }

    // Validate size (< 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setValidationError('File size exceeds 50 MB demo limit. Please upload a smaller clip.');
      return;
    }

    // Check video duration using HTML5 Video Element
    const videoElem = document.createElement('video');
    videoElem.preload = 'metadata';
    videoElem.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElem.src);
      if (videoElem.duration > 35) {
        setValidationError(`Video duration (${Math.round(videoElem.duration)}s) exceeds maximum allowed limit of 30 seconds.`);
      } else {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    };
    videoElem.onerror = () => {
      setValidationError('Failed to read video metadata. File may be corrupted.');
    };
    videoElem.src = URL.createObjectURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleAnalyzeClick = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
          Multimodal Deepfake Detection
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
          Analyze video authenticity across three parallel forensic channels: <span className="text-cyan-400 font-medium">Visual Artifacts</span>, <span className="text-purple-400 font-medium">rPPG Pulse Biosignals</span>, and <span className="text-blue-400 font-medium">AV Phoneme-Viseme Sync</span>.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-surface-border relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {(validationError || error) && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Upload Validation Notice</p>
              <p className="text-red-300/90">{validationError || error}</p>
            </div>
          </div>
        )}

        {!selectedFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                : 'border-surface-border hover:border-cyan-500/50 bg-surface-card/40 hover:bg-surface-card/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
            
            <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <UploadCloud className="w-8 h-8" />
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-1">
              Drag & Drop Video Clip Here
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              Supports <span className="text-gray-200 font-mono">MP4, MOV</span> (Max clip length: <span className="text-cyan-400 font-semibold">30 seconds</span>, file size &lt; 50 MB)
            </p>
            
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              Browse Local Files
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 rounded-xl bg-surface-card/80 border border-surface-border">
              <div className="w-full sm:w-48 h-28 bg-black rounded-lg overflow-hidden relative flex-shrink-0 border border-surface-border">
                {previewUrl && (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-cyan-400 font-medium text-sm">
                  <Film className="w-4 h-4" />
                  <span>File Selected & Validated</span>
                </div>
                <h4 className="font-bold text-white text-base truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-gray-400 font-mono">
                  Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="text-xs text-gray-400 hover:text-red-400 underline"
              >
                Change clip
              </button>
            </div>

            <button
              onClick={handleAnalyzeClick}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-cyan-500/20 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01]"
            >
              <Sparkles className="w-5 h-5 text-cyan-200 animate-spin" />
              <span>Run Multimodal Deepfake Verification</span>
            </button>
          </div>
        )}

        {/* Demo Clip Launcher & Disclaimer */}
        {onUseSampleVideo && !selectedFile && (
          <div className="mt-6 pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 space-y-3 sm:space-y-0">
            <span>Don't have a test video handy?</span>
            <button
              onClick={onUseSampleVideo}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-surface-border/50 hover:bg-surface-border text-cyan-300 font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load Synthetic Demo Sample Clip</span>
            </button>
          </div>
        )}
      </div>

      {/* 3 Signal Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl glass-panel border border-surface-border/50 space-y-2">
          <div className="font-semibold text-cyan-400 text-sm">1. Visual Forensics</div>
          <p className="text-gray-400">Scans 2D FFT/DCT spectral domain for GAN/Diffusion frequency grids and boundary blending discontinuities.</p>
        </div>
        <div className="p-4 rounded-xl glass-panel border border-surface-border/50 space-y-2">
          <div className="font-semibold text-purple-400 text-sm">2. rPPG Biosignals</div>
          <p className="text-gray-400">Extracts subtle facial skin reflectance pulse across forehead and cheek ROIs to evaluate heart rate and region phase coherence.</p>
        </div>
        <div className="p-4 rounded-xl glass-panel border border-surface-border/50 space-y-2">
          <div className="font-semibold text-blue-400 text-sm">3. AV Phoneme-Viseme Sync</div>
          <p className="text-gray-400">Correlates mouth vertical opening dynamics with audio MFCC speech energy to catch lip-sync lead/lag offsets.</p>
        </div>
      </div>
    </div>
  );
};
