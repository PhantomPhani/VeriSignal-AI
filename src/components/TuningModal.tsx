import React, { useState } from 'react';
import { X, Sliders, RotateCcw } from 'lucide-react';

interface TuningModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: { visual: number; rppg: number; av_sync: number };
  onUpdateWeights: (newWeights: { visual: number; rppg: number; av_sync: number }) => void;
}

export const TuningModal: React.FC<TuningModalProps> = ({
  isOpen,
  onClose,
  weights,
  onUpdateWeights
}) => {
  const [visual, setVisual] = useState(weights.visual);
  const [rppg, setRppg] = useState(weights.rppg);
  const [avSync, setAvSync] = useState(weights.av_sync);

  if (!isOpen) return null;

  const handleReset = () => {
    setVisual(0.40);
    setRppg(0.35);
    setAvSync(0.25);
  };

  const handleSave = () => {
    const total = visual + rppg + avSync;
    if (total === 0) return;
    // Normalize to sum to 1.0
    onUpdateWeights({
      visual: Number((visual / total).toFixed(2)),
      rppg: Number((rppg / total).toFixed(2)),
      av_sync: Number((avSync / total).toFixed(2)),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-surface-border p-6 space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-lg">
            <Sliders className="w-5 h-5" />
            <span>Tune Fusion Engine Weights</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Adjust relative weights assigned to each forensic detection branch. Fusion weights are automatically multiplied by each branch's reading confidence.
        </p>

        <div className="space-y-4 text-xs">
          {/* Visual Weight */}
          <div className="space-y-1">
            <div className="flex justify-between font-semibold">
              <span className="text-cyan-400">Visual Forensics Weight</span>
              <span className="font-mono text-gray-200">{Math.round(visual * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={visual}
              onChange={(e) => setVisual(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-surface-card rounded-lg h-2"
            />
          </div>

          {/* rPPG Weight */}
          <div className="space-y-1">
            <div className="flex justify-between font-semibold">
              <span className="text-purple-400">rPPG Biosignals Weight</span>
              <span className="font-mono text-gray-200">{Math.round(rppg * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={rppg}
              onChange={(e) => setRppg(parseFloat(e.target.value))}
              className="w-full accent-purple-400 bg-surface-card rounded-lg h-2"
            />
          </div>

          {/* AV Sync Weight */}
          <div className="space-y-1">
            <div className="flex justify-between font-semibold">
              <span className="text-blue-400">AV Sync Weight</span>
              <span className="font-mono text-gray-200">{Math.round(avSync * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={avSync}
              onChange={(e) => setAvSync(parseFloat(e.target.value))}
              className="w-full accent-blue-400 bg-surface-card rounded-lg h-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-surface-border text-xs">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-gray-400 hover:text-cyan-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-card text-gray-300 hover:bg-surface-border"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
            >
              Apply Weights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
