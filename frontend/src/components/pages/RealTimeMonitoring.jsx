import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { mlAPI } from '../../services/api';
import './RealTimeMonitoring.css';

const SENSORS = [
  { key: 'soil_ph',        label: 'Soil pH',       unit: '',      min: 0,  max: 14,  optimal: [6.0, 6.8],  color: '#3AAFA9', icon: '🧪' },
  { key: 'humidity',       label: 'Humidity',       unit: '%',     min: 0,  max: 100, optimal: [60, 80],    color: '#2196F3', icon: '💧' },
  { key: 'temperature',    label: 'Temperature',    unit: '°C',    min: 0,  max: 50,  optimal: [20, 28],    color: '#FF9800', icon: '🌡️' },
  { key: 'soil_moisture',  label: 'Soil Moisture',  unit: '%',     min: 0,  max: 100, optimal: [60, 80],    color: '#4CAF50', icon: '🌱' },
  { key: 'nitrogen',       label: 'Nitrogen (N)',   unit: ' mg/kg',min: 0,  max: 500, optimal: [150, 250],  color: '#9C27B0', icon: '⚗️' },
  { key: 'phosphorus',     label: 'Phosphorus (P)', unit: ' mg/kg',min: 0,  max: 200, optimal: [40, 80],    color: '#E91E63', icon: '⚗️' },
  { key: 'potassium',      label: 'Potassium (K)',  unit: ' mg/kg',min: 0,  max: 500, optimal: [150, 250],  color: '#FF5722', icon: '⚗️' },
  { key: 'pesticide_level',label: 'Pesticide',      unit: ' mg/L', min: 0,  max: 2,   optimal: [0, 0.05],   color: '#F44336', icon: '🔬' },
];

function getStatus(val, optimal) {
  if (val == null) return 'no-data';
  const [lo, hi] = optimal;
  const mid = (lo + hi) / 2, span = (hi - lo) / 2 || 1;
  const dev = Math.abs(val - mid) / span;
  if (dev < 0.5) return 'good';
  if (dev < 1.2) return 'warn';
  return 'danger';
}

/* Arc gauge SVG */
function Gauge({ value, min, max, optimal, color, size = 120 }) {
  const pct = value != null ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const angle = pct * 180;
  const r = 44, cx = 60, cy = 60;
  const toRad = (a) => (a - 180) * (Math.PI / 180);
  const arcX = (a) => cx + r * Math.cos(toRad(a));
  const arcY = (a) => cy + r * Math.sin(toRad(a));
  const optLo = ((optimal[0] - min) / (max - min)) * 180;
  const optHi = ((optimal[1] - min) / (max - min)) * 180;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 120 72">
      {/* Background arc */}
      <path d={`M ${arcX(0)} ${arcY(0)} A ${r} ${r} 0 0 1 ${arcX(180)} ${arcY(180)}`}
        fill="none" stroke="#e8e8e8" strokeWidth="8" strokeLinecap="round" />
      {/* Optimal zone */}
      <path d={`M ${arcX(optLo)} ${arcY(optLo)} A ${r} ${r} 0 ${optHi - optLo > 180 ? 1 : 0} 1 ${arcX(optHi)} ${arcY(optHi)}`}
        fill="none" stroke="rgba(46,125,82,0.2)" strokeWidth="8" />
      {/* Value arc */}
      {value != null && (
        <path d={`M ${arcX(0)} ${arcY(0)} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${arcX(angle)} ${arcY(angle)}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      )}
      {/* Needle dot */}
      {value != null && (
        <circle cx={arcX(angle)} cy={arcY(angle)} r="5" fill={color} />
      )}
    </svg>
  );
}

/* Mini sparkline */
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <div className="spark-empty">No history</div>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const w = 160, h = 36;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', height: 36 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RealTimeMonitoring() {
  const [farms, setFarms]       = useState([]);
  const [activeFarm, setFarm]   = useState(null);
  const [readings, setReadings] = useState([]);
  const [latest, setLatest]     = useState(null);
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({});
  const [submitting, setSubmit] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const intervalRef             = useRef(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    mlAPI.getFarms().then(({ data }) => {
      setFarms(data);
      if (data[0]) setFarm(data[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeFarm) return;
    const load = () => {
      mlAPI.getReadings(activeFarm.id).then(({ data }) => {
        setReadings(data);
        setLatest(data[0] || null);
      }).catch(() => {});
      mlAPI.getAlerts({ farm: activeFarm.id, unread: 'true' })
        .then(({ data }) => setAlerts(data.slice(0, 3))).catch(() => {});
    };
    load();
    // Poll every 30s for live updates
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [activeFarm]);

  const handleLog = async (e) => {
    e.preventDefault();
    setSubmit(true);
    try {
      const payload = { farm: activeFarm.id };
      SENSORS.forEach(({ key }) => { if (form[key]) payload[key] = parseFloat(form[key]); });
      const { data } = await mlAPI.postReading(payload);
      setLatest(data);
      setReadings(r => [data, ...r].slice(0, 50));
      setShowForm(false);
      setForm({});
      // Refresh alerts
      mlAPI.getAlerts({ farm: activeFarm.id, unread: 'true' }).then(({ data }) => setAlerts(data.slice(0, 3)));
    } catch (err) { console.error(err); }
    finally { setSubmit(false); }
  };

  const seriesFor = (key) => readings.map(r => r[key]).filter(v => v != null).reverse().slice(-20);

  return (
    <DashboardLayout>
      <div className="rtm-page">
        {/* Header */}
        <div className="rtm-header">
          <div>
            <h1 className="rtm-title">Real-Time Monitoring</h1>
            <div className="rtm-live-badge">
              <span className="live-dot" />
              LIVE · {liveTime.toLocaleTimeString('en-KE')}
            </div>
          </div>
          <div className="rtm-controls">
            <div className="farm-chips">
              {farms.map(f => (
                <button key={f.id} className={`farm-chip ${activeFarm?.id === f.id ? 'active' : ''}`}
                  onClick={() => setFarm(f)}>🌾 {f.name}</button>
              ))}
            </div>
            <button className="btn-log" onClick={() => setShowForm(!showForm)}>
              + Log Reading
            </button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.map(a => (
          <div key={a.id} className={`rtm-alert sev-${a.severity}`}>
            <span className="alert-dot-icon">{a.severity === 'critical' ? '🚨' : a.severity === 'high' ? '⚠️' : 'ℹ️'}</span>
            <div><strong>{a.title}</strong><p>{a.message}</p></div>
          </div>
        ))}

        {/* No farm state */}
        {!loading && farms.length === 0 && (
          <div className="rtm-empty">
            <div className="empty-icon">🌾</div>
            <h3>No farms registered yet</h3>
            <p>Go to the Farm AI dashboard to create your first farm and start logging sensor data.</p>
          </div>
        )}

        {/* Status bar */}
        {latest && (
          <div className="rtm-status-bar">
            <div className="status-item">
              <span className="status-label">Last reading</span>
              <span className="status-val">{new Date(latest.timestamp).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Farm</span>
              <span className="status-val">{activeFarm?.name}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Crop</span>
              <span className="status-val">{activeFarm?.crop_type || 'Not set'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Total readings</span>
              <span className="status-val">{readings.length}</span>
            </div>
          </div>
        )}

        {/* Sensor gauge grid */}
        {activeFarm && (
          <div className="sensor-gauge-grid">
            {SENSORS.map(({ key, label, unit, min, max, optimal, color, icon }) => {
              const val = latest?.[key];
              const st  = getStatus(val, optimal);
              const series = seriesFor(key);
              return (
                <div key={key} className={`gauge-card status-${st}`}>
                  <div className="gauge-top">
                    <div className="gauge-icon-label">
                      <span className="gauge-icon" style={{ fontSize: 16 }}>{icon}</span>
                      <span className="gauge-label">{label}</span>
                    </div>
                    <span className={`gauge-status-dot dot-${st}`} />
                  </div>

                  <div className="gauge-center">
                    <Gauge value={val} min={min} max={max} optimal={optimal} color={color} />
                    <div className="gauge-value-display">
                      {val != null
                        ? <><span className="gauge-number">{typeof val === 'number' ? val.toFixed(1) : val}</span><span className="gauge-unit">{unit}</span></>
                        : <span className="gauge-no-data">No data</span>
                      }
                    </div>
                  </div>

                  <div className="gauge-bottom">
                    <div className="gauge-optimal">Optimal: {optimal[0]}–{optimal[1]}{unit}</div>
                    {st !== 'no-data' && (
                      <span className={`gauge-status-tag tag-${st}`}>
                        {st === 'good' ? '✓ Good' : st === 'warn' ? '⚠ Warning' : '✗ Critical'}
                      </span>
                    )}
                  </div>

                  {/* Sparkline */}
                  <div className="gauge-sparkline">
                    <Sparkline data={series} color={color} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Log form */}
        {showForm && (
          <form className="log-form" onSubmit={handleLog}>
            <div className="log-form-header">
              <h3>Log New Sensor Reading</h3>
              <button type="button" className="close-log" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="log-form-grid">
              {SENSORS.map(({ key, label, unit, min, max }) => (
                <div key={key} className="log-field">
                  <label>{label} <span className="unit-hint">{unit}</span></label>
                  <input type="number" step="any" min={min} max={max}
                    placeholder={`e.g. ${((min + max) / 2).toFixed(1)}`}
                    value={form[key] || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button type="submit" className="btn-submit-log" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Reading'}
            </button>
          </form>
        )}

        {/* History table */}
        {readings.length > 0 && (
          <div className="rtm-history">
            <h2 className="history-title">Reading History</h2>
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>pH</th>
                    <th>Humidity</th>
                    <th>Temp</th>
                    <th>Moisture</th>
                    <th>N</th>
                    <th>P</th>
                    <th>K</th>
                    <th>Pesticide</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.slice(0, 10).map(r => (
                    <tr key={r.id}>
                      <td>{new Date(r.timestamp).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className={`cell-${getStatus(r.soil_ph, [6, 6.8])}`}>{r.soil_ph?.toFixed(1) ?? '—'}</td>
                      <td className={`cell-${getStatus(r.humidity, [60, 80])}`}>{r.humidity?.toFixed(0) ?? '—'}%</td>
                      <td className={`cell-${getStatus(r.temperature, [20, 28])}`}>{r.temperature?.toFixed(1) ?? '—'}°C</td>
                      <td className={`cell-${getStatus(r.soil_moisture, [60, 80])}`}>{r.soil_moisture?.toFixed(0) ?? '—'}%</td>
                      <td>{r.nitrogen?.toFixed(0) ?? '—'}</td>
                      <td>{r.phosphorus?.toFixed(0) ?? '—'}</td>
                      <td>{r.potassium?.toFixed(0) ?? '—'}</td>
                      <td className={`cell-${getStatus(r.pesticide_level, [0, 0.05])}`}>{r.pesticide_level?.toFixed(2) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
