import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface WaveformTimelineProps {
  rppgTrace?: number[];
  rppgTimestamps?: number[];
  lipTrace?: number[];
  audioTrace?: number[];
  avTimestamps?: number[];
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  rppgTrace = [],
  rppgTimestamps = [],
  lipTrace = [],
  audioTrace = [],
  avTimestamps = []
}) => {
  // Combine traces by timestamp
  const timestamps = rppgTimestamps.length > 0 ? rppgTimestamps : avTimestamps;

  if (!timestamps || timestamps.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-xs italic bg-surface-card/40 rounded-xl border border-surface-border">
        No waveform temporal trace available for this clip format.
      </div>
    );
  }

  const chartData = timestamps.map((time, idx) => {
    return {
      time: `${time}s`,
      rppgPulse: rppgTrace[idx] !== undefined ? rppgTrace[idx] : null,
      lipAperture: lipTrace[idx] !== undefined ? lipTrace[idx] : null,
      audioEnergy: audioTrace[idx] !== undefined ? audioTrace[idx] : null,
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs space-y-1 sm:space-y-0">
        <div>
          <span className="font-semibold text-gray-200">Temporal Signal Traces</span>
          <span className="text-gray-400 ml-2">(rPPG forehead pulse vs AV lip/audio dynamics over clip duration)</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-cyan-400 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span>rPPG Pulse</span>
          </span>
          <span className="flex items-center space-x-1.5 text-purple-400 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
            <span>Lip Motion</span>
          </span>
          <span className="flex items-center space-x-1.5 text-blue-400 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
            <span>Audio Energy</span>
          </span>
        </div>
      </div>

      <div className="h-56 w-full bg-surface-card/60 rounded-xl border border-surface-border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#243049" />
            <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#243049',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#fff'
              }}
            />
            {rppgTrace.length > 0 && (
              <Line
                type="monotone"
                dataKey="rppgPulse"
                name="rPPG Pulse (POS)"
                stroke="#00f2fe"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {lipTrace.length > 0 && (
              <Line
                type="monotone"
                dataKey="lipAperture"
                name="Lip Aperture"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {audioTrace.length > 0 && (
              <Line
                type="monotone"
                dataKey="audioEnergy"
                name="Audio Energy"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
