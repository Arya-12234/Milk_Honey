import React, { useState, useEffect } from 'react';
import { mlAPI } from '../../services/api';
import './SensorMonitor.css';

const SENSORS = [
  { key: 'soil_ph',        label: 'Soil pH',       unit: '',     min: 0, max: 14,   optimal: [6.0, 6.8],  icon: '🧪' },
  { key: 'humidity',       label: 'Humidity',       unit: '%',    min: 0, max: 100,  optimal: [60, 80],    icon: '💧' },
  { key: 'temperature',    label: 'Temperature',    unit: '°C',   min: 0, max: 50,   optimal: [20, 28],    icon: '🌡️' },
  { key: 'soil_moisture',  label: 'Soil Moisture',  unit: '%',    min: 0, max: 100,  optimal: [60, 80],    icon: '🌱' },
  { key: 'nitrogen',       label: 'Nitrogen (N)',   unit: 'mg/kg',min: 0, max: 500,  optimal: [150, 250],  icon: '⚗️' },
  { key: 'phosphorus',     label: 'Phosphorus (P)', unit: 'mg/kg',min: 0, max: 200,  optimal: [40, 80],    icon: '⚗️' },
  { key: 'potassium',      label: 'Potassium (K)',  unit: 'mg/kg',min: 0, max: 500,  optimal: [150, 250],  icon: '⚗️' },
  { key: 'pesticide_level',label: 'Pesticide',      unit: 'mg/L', min: 0, max: 2,    optimal: [0, 0.05],   icon: '🔬' },
];

function statusForValue(val, optimal) {
  if (val == null) return 'unknown';
  const [lo, hi] = optimal;
  const mid = (lo + hi) / 2;
  const span = (hi - lo) / 2 || 1;
  const dev = Math.abs(val - mid) / span;
  if (dev < 0.5) return 'good';
  if (dev < 1.2) return 'warn';
  return 'danger';
}

export default function SensorMonitor({ farm }) {
  const [reading, setReading] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!farm?.id) return;
    Promise.all([
      mlAPI.getReadings(farm.id).catch(() => ({ data: [] })),
      mlAPI.getAlerts({ farm: farm.id, unread: 'true' }).catch(() => ({ data: [] })),
    ]).then(([readRes, alertRes]) => {
      setReading(readRes.data[0] || null);
      setAlerts(alertRes.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [farm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { farm: farm.id };
      SENSORS.forEach(({ key }) => {
        const v = parseFloat(form[key]);
        if (!isNaN(v)) payload[key] = v;
      });
      const { data } = await mlAPI.postReading(payload);
      setReading(data);
      setShowForm(false);
      // Refresh alerts
      const alertRes = await mlAPI.getAlerts({ farm: farm.id, unread: 'true' });
      setAlerts(alertRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="sensor-loading"><span className="spinner" style={{ borderTopColor: 'var(--gold)' }} /></div>;

  return (
    <div className="sensor-monitor">
      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div className="alerts-banner">
          {alerts.map((a) => (
            <div key={a.id} className={`alert-item severity-${a.severity}`}>
              <span className="alert-icon">{a.severity === 'critical' ? '🚨' : a.severity === 'high' ? '⚠️' : 'ℹ️'}</span>
              <div>
                <strong>{a.title}</strong>
                <p>{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sensor grid */}
      <div className="sensor-grid">
        {SENSORS.map(({ key, label, unit, min, max, optimal, icon }) => {
          const val = reading?.[key];
          const pct = val != null ? Math.min(100, ((val - min) / (max - min)) * 100) : null;
          const st = statusForValue(val, optimal);
          return (
            <div key={key} className={`sensor-tile card status-${st}`}>
              <div className="sensor-tile-header">
                <span className="sensor-icon">{icon}</span>
                <span className="sensor-label">{label}</span>
                <span className={`sensor-dot dot-${st}`} />
              </div>
              <div className="sensor-value">
                {val != null ? `${typeof val === 'number' ? val.toFixed(1) : val}${unit}` : '—'}
              </div>
              {pct != null && (
                <div className="sensor-bar-wrap">
                  <div className="sensor-bar" style={{ width: `${pct}%` }} />
                  {/* Optimal range indicator */}
                  <div
                    className="optimal-range"
                    style={{
                      left: `${((optimal[0] - min) / (max - min)) * 100}%`,
                      width: `${((optimal[1] - optimal[0]) / (max - min)) * 100}%`,
                    }}
                  />
                </div>
              )}
              <div className="sensor-optimal">
                Optimal: {optimal[0]}–{optimal[1]}{unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add reading button */}
      <div className="sensor-actions">
        <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Log Sensor Reading'}
        </button>
      </div>

      {/* Manual input form */}
      {showForm && (
        <form className="sensor-form card fade-up" onSubmit={handleSubmit}>
          <h4>Log New Sensor Reading</h4>
          <div className="sensor-form-grid">
            {SENSORS.map(({ key, label, unit, min, max }) => (
              <div key={key} className="field">
                <label>{label} {unit && <span className="optional">({unit})</span>}</label>
                <input
                  type="number"
                  step="0.01"
                  min={min}
                  max={max}
                  placeholder={`e.g. ${((min + max) / 2).toFixed(1)}`}
                  value={form[key] || ''}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><span className="spinner" /> Saving…</> : 'Save Reading'}
          </button>
        </form>
      )}
    </div>
  );
}
