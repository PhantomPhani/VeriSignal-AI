export interface BranchDetails {
  fft_spectral_anomaly?: number;
  boundary_mismatch?: number;
  chroma_noise_anomaly?: number;
  sampled_frames?: number;
  forehead_cheek_corr?: number;
  lighting_stability?: number;
  lag_frames?: number;
  max_correlation?: number;
}

export interface BranchResult {
  score: number;
  reading_confidence: number;
  explanation: string;
  heart_rate_bpm?: number | null;
  snr_db?: number;
  phase_coherence?: number;
  pulse_trace?: number[];
  timestamps?: number[];
  offset_ms?: number;
  correlation?: number;
  has_speech?: boolean;
  lip_trace?: number[];
  audio_trace?: number[];
  details?: BranchDetails;
}

export interface FusionResult {
  overall_authenticity_score: number;
  synthetic_anomaly_score: number;
  classification: 'Likely Authentic' | 'Inconclusive' | 'Likely Synthetic';
  classification_key: 'authentic' | 'inconclusive' | 'synthetic';
  summary: string;
  weights_used: {
    visual: number;
    rppg: number;
    av_sync: number;
  };
  branch_breakdown: {
    visual: BranchResult;
    rppg: BranchResult;
    av_sync: BranchResult;
  };
  video_metadata?: {
    filename: string;
    duration_seconds: number;
    fps: number;
    file_size_mb: number;
  };
}

export type AppStage = 'upload' | 'processing' | 'results';
