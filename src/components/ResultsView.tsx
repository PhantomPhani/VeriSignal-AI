import React, { useState } from 'react';
import { FusionResult } from '../types';
import { WaveformTimeline } from './WaveformTimeline';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  Mic,
  Info,
  RefreshCw,
  Sliders,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface ResultsViewProps {
  result: FusionResult;
  onReset: () => void;
  onOpenWeights: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  onReset,
  onOpenWeights
}) => {
  const [expandedBranch, setExpandedBranch] = useState<'visual' | 'rppg' | 'av_sync' | null>('visual');

  const {
    overall_authenticity_score,
    classification,
    classification_key,
    summary,
    branch_breakdown,
    video_metadata
  } = result;

  const visual = branch_breakdown.visual;
  const rppg = branch_breakdown.rppg;
  const av_sync = branch_breakdown.av_sync;

  const toggleBranch = (key: 'visual' | 'rppg' | 'av_sync') => {
    setExpandedBranch((prev) => (prev === key ? null : key));
  };

  // Color mappings
  const getBadgeStyle = () => {
    switch (classification_key) {
      case 'authentic':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          gaugeGradient: 'from-emerald-500 to-teal-400',
          icon: ShieldCheck
        };
      case 'synthetic':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
          gaugeGradient: 'from-red-600 to-orange-500',
          icon: XCircle
        };
      default:
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          gaugeGradient: 'from-amber-500 to-yellow-400',
          icon: AlertTriangle
        };
    }
  };

  const badge = getBadgeStyle();
  const BadgeIcon = badge.icon;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Analysis Report:</span>
            <span className="text-cyan-400 font-mono text-base font-normal">
              {video_metadata?.filename || 'Uploaded Clip'}
            </span>
          </h2>
          {video_metadata && (
            <p className="text-xs text-gray-400 font-mono">
              Duration: {video_metadata.duration_seconds}s | FPS: {video_metadata.fps} | Size: {video_metadata.file_size_mb} MB
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenWeights}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs text-gray-300 hover:text-cyan-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tune Weights</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs shadow-md transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Analyze Another Clip</span>
          </button>
        </div>
      </div>

      {/* Hero Score Gauge Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-surface-border space-y-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Circular Score Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Outer Glow Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-surface-border"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * overall_authenticity_score) / 100}
                  strokeLinecap="round"
                  stroke="url(#scoreGradient)"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00f2fe" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
                  {Math.round(overall_authenticity_score)}
                </span>
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                  / 100 Authenticity
                </span>
              </div>
            </div>
          </div>

          {/* Classification & Summary */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${badge.bg}">
              <BadgeIcon className="w-4 h-4" />
              <span>Verdict: {classification}</span>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              {summary}
            </p>

            {/* Probabilistic framing callout */}
            <div className="p-3 rounded-xl bg-surface-card/80 border border-surface-border flex items-start space-x-2 text-xs text-gray-400">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-gray-200">Probabilistic Indicator:</strong> Score reflects combined reading-confidence weighted algorithmic signals. This is a research demo, not proof of origin.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Waveform Visualization */}
      <div className="glass-panel p-6 rounded-2xl border border-surface-border">
        <WaveformTimeline
          rppgTrace={rppg.pulse_trace}
          rppgTimestamps={rppg.timestamps}
          lipTrace={av_sync.lip_trace}
          audioTrace={av_sync.audio_trace}
          avTimestamps={av_sync.timestamps}
        />
      </div>

      {/* 3 Expandable Branch Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center justify-between">
          <span>Forensic Branch Breakdown</span>
          <span className="text-xs text-gray-400 font-normal">Click any card to expand metrics</span>
        </h3>

        {/* 1. Visual Forensics Card */}
        <div className="glass-panel rounded-xl border border-surface-border overflow-hidden">
          <div
            onClick={() => toggleBranch('visual')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-surface-card/60 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-sm">Visual Forensics Branch</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-card border border-surface-border text-gray-300 font-mono">
                    Weight: {Math.round(result.weights_used.visual * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate max-w-sm sm:max-w-md">
                  {visual.explanation}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-mono font-bold text-cyan-400">
                  {visual.score}/100 Anomaly
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  Conf: {Math.round(visual.reading_confidence * 100)}%
                </div>
              </div>
              {expandedBranch === 'visual' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedBranch === 'visual' && (
            <div className="p-5 border-t border-surface-border bg-surface-card/40 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <span className="text-gray-400">FFT Spectral Anomaly</span>
                  <div className="text-lg font-bold text-cyan-400 font-mono">
                    {visual.details?.fft_spectral_anomaly ?? 'N/A'} / 100
                  </div>
                  <p className="text-[10px] text-gray-500">GAN high-frequency grid artifacts</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <span className="text-gray-400">Boundary Sharpness Variance</span>
                  <div className="text-lg font-bold text-purple-400 font-mono">
                    {visual.details?.boundary_mismatch ?? 'N/A'} / 100
                  </div>
                  <p className="text-[10px] text-gray-500">Laplacian ROI edge differential</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <span className="text-gray-400">Chroma Channel Noise</span>
                  <div className="text-lg font-bold text-blue-400 font-mono">
                    {visual.details?.chroma_noise_anomaly ?? 'N/A'} / 100
                  </div>
                  <p className="text-[10px] text-gray-500">YCrCb compression noise delta</p>
                </div>
              </div>

              <div className="text-gray-300">
                <strong className="text-white">Analysis Findings: </strong>
                {visual.explanation}
              </div>
            </div>
          )}
        </div>

        {/* 2. rPPG Biosignals Card */}
        <div className="glass-panel rounded-xl border border-surface-border overflow-hidden">
          <div
            onClick={() => toggleBranch('rppg')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-surface-card/60 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-sm">rPPG Biosignal Branch</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-card border border-surface-border text-gray-300 font-mono">
                    Weight: {Math.round(result.weights_used.rppg * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate max-w-sm sm:max-w-md">
                  {rppg.explanation}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-mono font-bold text-purple-400">
                  {rppg.score}/100 Anomaly
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  Conf: {Math.round(rppg.reading_confidence * 100)}%
                </div>
              </div>
              {expandedBranch === 'rppg' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedBranch === 'rppg' && (
            <div className="p-5 border-t border-surface-border bg-surface-card/40 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <span className="text-gray-400">Estimated Heart Rate</span>
                  <div className="text-lg font-bold text-purple-400 font-mono">
                    {rppg.heart_rate_bpm ? `${rppg.heart_rate_bpm} BPM` : 'N/A'}
                  </div>
                  <p className="text-[10px] text-gray-500">FFT pulse spectrum peak</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <span className="text-gray-400">Pulse SNR</span>
                  <div className="text-lg font-bold text-cyan-400 font-mono">
                    {rppg.snr_db} dB
                  </div>
                  <p className="text-[10px] text-gray-500">Signal-to-noise ratio in 0.75-3Hz band</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <span className="text-gray-400">ROI Phase Coherence</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {rppg.phase_coherence}
                  </div>
                  <p className="text-[10px] text-gray-500">Forehead-cheek pulse correlation</p>
                </div>
              </div>

              <div className="text-gray-300">
                <strong className="text-white">Analysis Findings: </strong>
                {rppg.explanation}
              </div>

              {rppg.reading_confidence < 0.45 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                  <strong>rPPG Reading Caveat:</strong> Reading confidence is reduced due to video resolution or lighting variations. The fusion layer automatically down-weighted this branch so low rPPG signal quality does not penalize clip authenticity.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Audio-Visual Sync Card */}
        <div className="glass-panel rounded-xl border border-surface-border overflow-hidden">
          <div
            onClick={() => toggleBranch('av_sync')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-surface-card/60 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-sm">Audio-Visual Sync Branch</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-card border border-surface-border text-gray-300 font-mono">
                    Weight: {Math.round(result.weights_used.av_sync * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate max-w-sm sm:max-w-md">
                  {av_sync.explanation}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-mono font-bold text-blue-400">
                  {av_sync.score}/100 Anomaly
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  Conf: {Math.round(av_sync.reading_confidence * 100)}%
                </div>
              </div>
              {expandedBranch === 'av_sync' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedBranch === 'av_sync' && (
            <div className="p-5 border-t border-surface-border bg-surface-card/40 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <span className="text-gray-400">Lip-Speech Lag/Lead</span>
                  <div className="text-lg font-bold text-blue-400 font-mono">
                    {av_sync.has_speech ? `${av_sync.offset_ms} ms` : 'N/A'}
                  </div>
                  <p className="text-[10px] text-gray-500">Detected viseme-phoneme timing offset</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <span className="text-gray-400">Max Cross-Correlation</span>
                  <div className="text-lg font-bold text-cyan-400 font-mono">
                    {av_sync.has_speech ? av_sync.correlation : 'N/A'}
                  </div>
                  <p className="text-[10px] text-gray-500">Mouth aperture vs audio envelope</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <span className="text-gray-400">Speech Detected</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {av_sync.has_speech ? 'Yes' : 'No Speech Track'}
                  </div>
                  <p className="text-[10px] text-gray-500">Audio track status</p>
                </div>
              </div>

              <div className="text-gray-300">
                <strong className="text-white">Analysis Findings: </strong>
                {av_sync.explanation}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer Text Footer */}
      <div className="p-4 rounded-xl bg-surface-card/40 border border-surface-border/60 text-xs text-gray-400 space-y-1">
        <div className="font-semibold text-gray-300 flex items-center space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Research & Forensic Disclaimer</span>
        </div>
        <p className="leading-relaxed text-[11px] text-gray-400">
          VeriSignal is a research demonstration tool developed for educational and experimental analysis. Results are probabilistic indicators based on computer vision and signal extraction algorithms, not legal or forensic proof of video authenticity. rPPG biosignal accuracy degrades on re-encoded or heavily compressed video and may vary with lighting conditions.
        </p>
      </div>
    </div>
  );
};
