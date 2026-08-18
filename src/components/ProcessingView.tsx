import React, { useEffect, useState } from 'react';
import { Eye, Heart, Mic, Cpu, CheckCircle2, Loader2 } from 'lucide-react';

interface ProcessingViewProps {
  progress: number;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({ progress }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const visualDone = progress >= 40;
  const rppgDone = progress >= 65;
  const avDone = progress >= 85;
  const fusionDone = progress >= 95;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Parallel Inference Pipeline Executing... {elapsed}s</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Analyzing Deepfake Signals
        </h2>
        <p className="text-sm text-gray-400">
          Running concurrent frame sampling, rPPG pulse extraction, and audio-visual correlation.
        </p>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-surface-border space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-gray-200">Pipeline Status</span>
          <span className="font-mono text-cyan-400 font-bold">{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full h-3 bg-surface-card rounded-full overflow-hidden p-0.5 border border-surface-border">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/50"
            style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
          />
        </div>
      </div>

      {/* 4 Parallel Branch Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Visual Branch */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          visualDone
            ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-300'
            : 'bg-surface-card/60 border-surface-border text-gray-400'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2.5 font-semibold text-sm">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>1. Visual Forensics</span>
            </div>
            {visualDone ? (
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {visualDone ? 'FFT frequency spectra & boundary gradients scanned.' : 'Sampling frame high frequencies...'}
          </p>
        </div>

        {/* rPPG Branch */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          rppgDone
            ? 'bg-purple-950/20 border-purple-500/40 text-purple-300'
            : 'bg-surface-card/60 border-surface-border text-gray-400'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2.5 font-semibold text-sm">
              <Heart className="w-4 h-4 text-purple-400" />
              <span>2. rPPG Biosignal Engine</span>
            </div>
            {rppgDone ? (
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            ) : (
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {rppgDone ? 'ROI pulse waveforms & phase coherence evaluated.' : 'Filtering 0.75-3Hz green reflectance...'}
          </p>
        </div>

        {/* AV Sync Branch */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          avDone
            ? 'bg-blue-950/20 border-blue-500/40 text-blue-300'
            : 'bg-surface-card/60 border-surface-border text-gray-400'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2.5 font-semibold text-sm">
              <Mic className="w-4 h-4 text-blue-400" />
              <span>3. Audio-Visual Sync</span>
            </div>
            {avDone ? (
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {avDone ? 'Phoneme-viseme lip offset cross-correlated.' : 'Extracting audio MFCCs vs lip aperture...'}
          </p>
        </div>

        {/* Fusion Layer */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          fusionDone
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
            : 'bg-surface-card/60 border-surface-border text-gray-400'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2.5 font-semibold text-sm">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>4. Confidence Fusion</span>
            </div>
            {fusionDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {fusionDone ? 'Confidence-weighted verdict computed.' : 'Awaiting branch reading confidences...'}
          </p>
        </div>
      </div>
    </div>
  );
};
