import React, { useState, useEffect } from 'react';
import { mlAPI } from '../../services/api';
import './YieldPredictor.css';

const INPUTS = [
  { key: 'soil_ph',        label: 'Soil pH',          min: 4, max: 9,   step: 0.1, default: 6.5 },
  { key: 'humidity',       label: 'Humidity (%)',      min: 0, max: 100, step: 1,   default: 70  },
  { key: 'temperature',    label: 'Temperature (°C)',  min: 10, max: 45, step: 0.5, default: 24  },
  { key: 'soil_moisture',  label: 'Soil Moisture (%)', min: 0, max: 100, step: 1,   default: 65  },
  { key: 'nitrogen',       label: 'Nitrogen (mg/kg)',  min: 0, max: 500, step: 5,   default: 200 },
  { key: 'phosphorus',     label: 'Phosphorus (mg/kg)',min: 0, max: 200, step: 2,   default: 60  },
  { key: 'potassium',      label: 'Potassium (mg/kg)', min: 0, max: 500, step: 5,   default: 200 },
  { key: 'pesticide_level',label: 'Pesticide (mg/L)',  min: 0, max: 2,   step: 0.01,default: 0.02},
];

export default function YieldPredictor({ farm }) {
  const [values, setValues] = useState(
    Object.fromEntries(INPUTS.map(({ key, default: d }) => [key, d]))
  );
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!farm?.id) return;
    mlAPI.getYieldHistory(farm.id).then(({ data }) => setHistory(data)).catch(() => {});
  }, [farm]);

  const handlePredict = async () => {
    if (!farm?.id) return;
    setLoading(true);
    try {
      const { data } = await mlAPI.predictYield({ farm: farm.id, ...values });
      setResult(data);
      setHistory((h) => [data, ...h].slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const yieldTonnes = result
    ? (result.predicted_yield_kg_per_ha / 1000).toFixed(1)
    : null;

  return (
    <div className="yield-card card">
      <div className="yield-header">
        <h3>Yield Predictor</h3>
        <span className="badge badge-gold">Gradient Boosting</span>
      </div>
      <p className="yield-subtitle">
        Adjust soil and climate parameters to forecast your expected harvest.
      </p>

      <div className="yield-sliders">
        {INPUTS.map(({ key, label, min, max, step }) => (
          <div key={key} className="slider-row">
            <div className="slider-label-row">
              <span className="slider-label">{label}</span>
              <span className="slider-value">{values[key]}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={values[key]}
              onChange={(e) => setValues((v) => ({ ...v, [key]: parseFloat(e.target.value) }))}
            />
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-full" onClick={handlePredict} disabled={loading}>
        {loading ? <><span className="spinner" /> Predicting…</> : 'Predict Yield'}
      </button>

      {result && (
        <div className="yield-result fade-up">
          <div className="yield-result-main">
            <div className="yield-number">{yieldTonnes} t/ha</div>
            <div className="yield-range">
              Range: {(result.confidence_low / 1000).toFixed(1)} – {(result.confidence_high / 1000).toFixed(1)} t/ha
            </div>
          </div>
          <div className="yield-bar-wrap">
            <div
              className="yield-bar"
              style={{ width: `${Math.min(100, (result.predicted_yield_kg_per_ha / 60000) * 100)}%` }}
            />
            <span className="yield-bar-label">vs 60 t/ha max</span>
          </div>

          {/* Factor breakdown */}
          {result.input_features?.factors && (
            <div className="factors">
              <p className="factors-title">Yield factor scores</p>
              {Object.entries(result.input_features.factors).map(([k, v]) => (
                <div key={k} className="factor-row">
                  <span className="factor-key">{k.replace(/_/g, ' ')}</span>
                  <div className="factor-bar-wrap">
                    <div
                      className="factor-bar"
                      style={{
                        width: `${(v * 100).toFixed(0)}%`,
                        background: v > 0.85 ? 'var(--success)' : v > 0.6 ? '#E67E22' : 'var(--error)',
                      }}
                    />
                  </div>
                  <span className="factor-pct">{(v * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="yield-history">
          <p className="yield-history-title">Recent predictions</p>
          {history.map((h, i) => (
            <div key={i} className="history-row">
              <span>{new Date(h.created_at).toLocaleDateString()}</span>
              <span className="history-val">{(h.predicted_yield_kg_per_ha / 1000).toFixed(1)} t/ha</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
