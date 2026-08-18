import React from 'react';
import { ShieldCheck, Activity, Sliders, Info } from 'lucide-react';

interface NavbarProps {
  onOpenWeights: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenWeights, onReset }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          onClick={onReset}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface rounded-[11px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-400">
                VeriSignal
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v1.0 Demo
              </span>
            </div>
            <p className="text-xs text-gray-400">Multimodal Deepfake Reality Checker</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenWeights}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs font-medium text-gray-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tune Fusion Weights</span>
          </button>
          
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>3 Signal Engines Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
