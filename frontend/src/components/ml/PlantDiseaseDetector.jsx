import React, { useState, useRef } from 'react';
import { mlAPI } from '../../services/api';
import './PlantDiseaseDetector.css';

const SEVERITY_COLOR = {
  healthy: 'var(--success)',
  early_blight: '#E67E22',
  late_blight: '#C0392B',
  leaf_mold: '#8E44AD',
  bacterial_spot: '#D35400',
  septoria_leaf_spot: '#E67E22',
  spider_mites: '#E74C3C',
  target_spot: '#E67E22',
  mosaic_virus: '#C0392B',
  yellow_leaf_curl: '#C0392B',
  unknown: 'var(--warm-gray)',
};

export default function PlantDiseaseDetector({ farmId }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) {
      setError('Please upload a JPG, PNG or WEBP image.');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (farmId) fd.append('farm', farmId);
      const { data } = await mlAPI.detectDisease(fd);
      setResult(data);
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  const topProbs = result
    ? Object.entries(result.all_probabilities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  return (
    <div className="detector-card card">
      <div className="detector-header">
        <h3>Plant Disease Detector</h3>
        <span className="badge badge-gold">AI Powered</span>
      </div>
      <p className="detector-subtitle">
        Upload a clear photo of a leaf to detect diseases instantly using our ResNet-18 model.
      </p>

      {!result ? (
        <>
          {/* Drop zone */}
          <div
            className={`dropzone ${dragOver ? 'drag-over' : ''} ${preview ? 'has-preview' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !preview && inputRef.current.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="preview-img" />
            ) : (
              <div className="dropzone-placeholder">
                <div className="dropzone-icon">🌿</div>
                <p>Drag &amp; drop a leaf image here</p>
                <span>or click to browse</span>
                <span className="dropzone-formats">JPG · PNG · WEBP · up to 10 MB</span>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {error && <p className="detector-error">{error}</p>}

          <div className="detector-actions">
            {preview && (
              <button className="btn btn-ghost" onClick={handleReset}>
                Remove
              </button>
            )}
            <button
              className="btn btn-primary"
              disabled={!file || loading}
              onClick={handleAnalyze}
            >
              {loading ? <><span className="spinner" /> Analysing…</> : 'Analyse Plant'}
            </button>
          </div>
        </>
      ) : (
        /* Result */
        <div className="result-wrap fade-up">
          <div className="result-preview-row">
            <img src={preview} alt="Analysed leaf" className="result-thumb" />
            <div className="result-main">
              <div
                className="result-label"
                style={{ color: SEVERITY_COLOR[result.predicted_class] }}
              >
                {result.is_healthy ? '✓ Healthy Plant' : `⚠ ${result.predicted_class.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`}
              </div>
              <div className="confidence-row">
                <span className="conf-label">Confidence</span>
                <div className="conf-bar-wrap">
                  <div
                    className="conf-bar"
                    style={{
                      width: `${(result.confidence * 100).toFixed(0)}%`,
                      background: SEVERITY_COLOR[result.predicted_class],
                    }}
                  />
                </div>
                <span className="conf-pct">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          {result.recommendation && (
            <div className={`recommendation-box ${result.is_healthy ? 'healthy' : 'disease'}`}>
              <strong>Recommendation</strong>
              <p>{result.recommendation}</p>
            </div>
          )}

          {/* Top 5 probabilities */}
          <div className="prob-list">
            <p className="prob-title">Top predictions</p>
            {topProbs.map(([cls, prob]) => (
              <div key={cls} className="prob-row">
                <span className="prob-cls">{cls.replace(/_/g, ' ')}</span>
                <div className="prob-bar-wrap">
                  <div className="prob-bar" style={{ width: `${(prob * 100).toFixed(0)}%` }} />
                </div>
                <span className="prob-pct">{(prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>

          <button className="btn btn-outline btn-full" onClick={handleReset} style={{ marginTop: '1rem' }}>
            Analyse Another Plant
          </button>
        </div>
      )}
    </div>
  );
}
