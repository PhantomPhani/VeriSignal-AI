import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { ProcessingView } from './components/ProcessingView';
import { ResultsView } from './components/ResultsView';
import { TuningModal } from './components/TuningModal';
import { AppStage, FusionResult } from './types';

export const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>('upload');
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<FusionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [weights, setWeights] = useState({
    visual: 0.40,
    rppg: 0.35,
    av_sync: 0.25,
  });

  const handleFileSelected = async (file: File) => {
    setError(null);
    setStage('processing');
    setProgress(15);

    const formData = new FormData();
    formData.append('file', file);

    // Simulate steady progress interval while backend processes
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 12;
      });
    }, 400);

    try {
      let response: Response;
      const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      try {
        response = await fetch(`${apiBase}/api/analyze`, {
          method: 'POST',
          body: formData,
        });
      } catch (primaryErr) {
        // Fallback to local default endpoint if relative/configured endpoint fails
        const fallbackUrl = apiBase ? `${apiBase}/api/analyze` : 'http://127.0.0.1:8000/api/analyze';
        response = await fetch(fallbackUrl, {
          method: 'POST',
          body: formData,
        });
      }

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Analysis failed.' }));
        throw new Error(errData.detail || 'Analysis request failed.');
      }

      const data: FusionResult = await response.json();
      setProgress(100);
      setResult(data);

      setTimeout(() => {
        setStage('results');
      }, 400);

    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'An unexpected error occurred during deepfake detection.');
      setStage('upload');
    }
  };

  const handleUseSampleVideo = async () => {
    // Generate or fetch synthetic test sample
    try {
      setError(null);
      setStage('processing');
      setProgress(20);

      // Create a small 2-second dummy Blob video for sample testing
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 320, 240);
        ctx.fillStyle = '#00f2fe';
        ctx.fillText('VeriSignal Sample Clip', 40, 120);
      }

      // Stream to webm blob
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const sampleFile = new File([blob], 'sample_demo_clip.webm', { type: 'video/webm' });
        handleFileSelected(sampleFile);
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 1500);

    } catch (e: any) {
      setError('Unable to auto-generate sample video in browser. Please upload an MP4 clip.');
      setStage('upload');
    }
  };

  const handleReset = () => {
    setStage('upload');
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
      <Navbar
        onOpenWeights={() => setIsWeightsModalOpen(true)}
        onReset={handleReset}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {stage === 'upload' && (
          <UploadZone
            onFileSelected={handleFileSelected}
            onUseSampleVideo={handleUseSampleVideo}
            error={error}
          />
        )}

        {stage === 'processing' && (
          <ProcessingView progress={progress} />
        )}

        {stage === 'results' && result && (
          <ResultsView
            result={result}
            onReset={handleReset}
            onOpenWeights={() => setIsWeightsModalOpen(true)}
          />
        )}
      </main>

      {/* Fusion Weights Modal */}
      <TuningModal
        isOpen={isWeightsModalOpen}
        onClose={() => setIsWeightsModalOpen(false)}
        weights={weights}
        onUpdateWeights={(newWeights) => setWeights(newWeights)}
      />
    </div>
  );
};

export default App;
