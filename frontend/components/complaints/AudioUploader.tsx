/**
 * AudioUploader.tsx
 * React component — upload a call recording, display transcript + analysis.
 * Drop this into any React + TypeScript app.
 *
 * Props:
 *   apiUrl  — backend URL (default: http://localhost:3001/upload-audio)
 */

import React, { useState, useRef } from 'react';

interface AnalysisResult {
  category?:           string;
  priority?:           string;
  urgency_score?:      number;
  sla_risk?:           string;
  recommended_action?: string;
  reasoning?:          string;
  confidence?:         number;
  escalation?:         string;
  status:              string;
}

interface UploadResponse {
  source:     string;
  transcript: string;
  analysis:   AnalysisResult;
}

interface Props {
  apiUrl?: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  High:   '#ef4444',
  Medium: '#f59e0b',
  Low:    '#22c55e',
};

const SLA_COLOR: Record<string, string> = {
  'High Risk':   '#ef4444',
  'Medium Risk': '#f59e0b',
  'Low Risk':    '#22c55e',
};

export default function AudioUploader({ apiUrl = 'http://localhost:3001/upload-audio' }: Props) {
  const [file,     setFile]     = useState<File | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<UploadResponse | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError(null);
    setFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch(apiUrl, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Upload failed');
      setResult(data as UploadResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = result?.analysis?.priority
    ? PRIORITY_COLOR[result.analysis.priority] ?? '#6b7280'
    : '#6b7280';

  const slaColor = result?.analysis?.sla_risk
    ? SLA_COLOR[result.analysis.sla_risk] ?? '#6b7280'
    : '#6b7280';

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📞 Call Recording Analysis</h2>
      <p style={styles.subtitle}>Upload a call recording to auto-classify the complaint</p>

      {/* File input */}
      <div style={styles.uploadBox}>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label="Upload audio file"
        />
        <button style={styles.chooseBtn} onClick={() => inputRef.current?.click()}>
          🎵 Choose Audio File
        </button>
        {file && <span style={styles.fileName}>{file.name}</span>}
      </div>

      <button
        style={{ ...styles.uploadBtn, opacity: (!file || loading) ? 0.5 : 1 }}
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? '⏳ Processing...' : '🚀 Upload & Analyze'}
      </button>

      {/* Loading spinner */}
      {loading && (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Transcribing audio and analyzing complaint…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={styles.resultBox}>
          {/* Source badge */}
          <div style={styles.sourceBadge}>📞 Source: {result.source}</div>

          {/* Transcript */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>📝 Transcript</h3>
            <p style={styles.transcriptText}>{result.transcript}</p>
          </section>

          {/* Analysis */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>🤖 AI Analysis</h3>
            <div style={styles.grid}>
              <Chip label="Category"  value={result.analysis.category}     color="#3b82f6" />
              <Chip label="Priority"  value={result.analysis.priority}     color={priorityColor} />
              <Chip label="SLA Risk"  value={result.analysis.sla_risk}     color={slaColor} />
              <Chip label="Escalation" value={result.analysis.escalation}  color="#8b5cf6" />
              {result.analysis.urgency_score !== undefined && (
                <Chip label="Urgency" value={`${(result.analysis.urgency_score * 100).toFixed(0)}%`} color="#f59e0b" />
              )}
              {result.analysis.confidence !== undefined && (
                <Chip label="Confidence" value={`${(result.analysis.confidence * 100).toFixed(0)}%`} color="#10b981" />
              )}
            </div>

            {result.analysis.recommended_action && (
              <div style={styles.actionBox}>
                <strong>✅ Recommended Action</strong>
                <p style={{ margin: '6px 0 0' }}>{result.analysis.recommended_action}</p>
              </div>
            )}

            {result.analysis.reasoning && (
              <details style={styles.reasoning}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>🔍 Reasoning</summary>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>{result.analysis.reasoning}</p>
              </details>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value?: string; color: string }) {
  if (!value) return null;
  return (
    <div style={{ ...styles.chip, borderColor: color }}>
      <span style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

// ── Inline styles (no CSS dependency) ────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container:     { maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' },
  title:         { fontSize: 22, fontWeight: 700, margin: '0 0 4px' },
  subtitle:      { color: '#6b7280', margin: '0 0 20px', fontSize: 14 },
  uploadBox:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  chooseBtn:     { padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: 14 },
  fileName:      { fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 },
  uploadBtn:     { width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 16 },
  loadingBox:    { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f0f9ff', borderRadius: 8, marginBottom: 16 },
  spinner:       { width: 20, height: 20, border: '3px solid #bfdbfe', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 },
  loadingText:   { fontSize: 14, color: '#1d4ed8', margin: 0 },
  errorBox:      { padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 14, marginBottom: 16 },
  resultBox:     { border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' },
  sourceBadge:   { background: '#1e293b', color: '#fff', padding: '6px 16px', fontSize: 12, fontWeight: 600 },
  section:       { padding: 16, borderBottom: '1px solid #f3f4f6' },
  sectionTitle:  { fontSize: 15, fontWeight: 700, margin: '0 0 10px' },
  transcriptText:{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0, background: '#f9fafb', padding: 12, borderRadius: 8 },
  grid:          { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  chip:          { padding: '6px 12px', borderRadius: 8, border: '1.5px solid', minWidth: 90 },
  actionBox:     { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12 },
  reasoning:     { fontSize: 14, color: '#374151', background: '#f9fafb', padding: 12, borderRadius: 8 },
};
