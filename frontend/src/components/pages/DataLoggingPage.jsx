import React, { useState, useEffect } from 'react';
import { mlAPI } from '../../services/api';
import './DataLoggingPage.css';

const METRICS = ['soil_ph', 'humidity', 'temperature', 'soil_moisture', 'nitrogen', 'phosphorus', 'potassium', 'pesticide_level'];
const LABELS = { soil_ph: 'Soil pH', humidity: 'Humidity', temperature: 'Temp °C', soil_moisture: 'Soil Moisture', nitrogen: 'Nitrogen', phosphorus: 'Phosphorus', potassium: 'Potassium', pesticide_level: 'Pesticide' };

function Sparkline({ values, color = '#1a5c42' }) {
  if (!values || values.length < 2) return <div className="sparkline-empty">No data</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120, h = 40;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="sparkline">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DataLoggingPage() {
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mlAPI.getFarms().then(({ data }) => {
      setFarms(data);
      if (data.length > 0) setActiveFarm(data[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeFarm) return;
    mlAPI.getReadings(activeFarm.id).then(({ data }) => setReadings(data)).catch(() => {});
  }, [activeFarm]);

  const metricSeries = (key) => readings.map(r => r[key]).filter(v => v != null).reverse();
  const latest = readings[0] || {};
  const avg = (key) => {
    const vals = metricSeries(key);
    if (!vals.length) return '—';
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  return (
    <div className="dl-page">
      <div className="dl-hero">
        <div className="container">
          <h1>Data Logging &amp; Analysis</h1>
          <p>Continuously records sensor data and transforms it into actionable insights.</p>
        </div>
      </div>

      <div className="container dl-body">
        {/* Farm selector */}
        <div className="dl-farm-bar">
          {farms.map(f => (
            <button key={f.id} className={`farm-chip ${activeFarm?.id === f.id ? 'active' : ''}`}
              onClick={() => setActiveFarm(f)}>🌾 {f.name}</button>
          ))}
        </div>

        {/* Info cards */}
        <div className="dl-info-grid">
          <div className="dl-info-card card">
            <h3>What it does</h3>
            <p>Collects sensor readings including pH, humidity, temperature and pest activity</p>
            <h3 style={{ marginTop: '1rem' }}>Key Features</h3>
            <ol className="dl-features">
              <li>Continuous monitoring</li>
              <li>Automatic data storage</li>
              <li>Trend analysis</li>
              <li>Custom reports and visual dashboards</li>
              <li>Alerts and notifications</li>
            </ol>
          </div>
          <div className="dl-info-card card">
            <h3>How it works</h3>
            <ol className="dl-features">
              <li>Stores time-stamped data in database</li>
              <li>Displays interactive charts and graphs</li>
              <li>Sends alerts on unusual patterns</li>
              <li>Data conversion provides reliable measurements</li>
            </ol>
            <div className="dl-best-practices" style={{ marginTop: '1rem' }}>
              <h3>Best Practices</h3>
              <div className="dl-bp-grid">
                {[
                  { title: 'Regular Backup', desc: 'Save and backup data regularly' },
                  { title: 'Clean & Validate', desc: 'Detect and correct anomalies' },
                  { title: 'Data Security', desc: 'Use encryption for protection' },
                ].map(bp => (
                  <div key={bp.title} className="dl-bp-card">
                    <strong>{bp.title}</strong>
                    <p>{bp.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live metrics with sparklines */}
        <h2 className="dl-section-title">Live Sensor Metrics</h2>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <span className="spinner" style={{ borderTopColor: '#1a5c42' }} />
          </div>
        ) : (
          <div className="dl-metrics-grid">
            {METRICS.map(key => {
              const series = metricSeries(key);
              const val = latest[key];
              return (
                <div key={key} className="dl-metric-card card">
                  <div className="dl-metric-header">
                    <span className="dl-metric-label">{LABELS[key]}</span>
                    <span className="dl-metric-count">{readings.length} readings</span>
                  </div>
                  <div className="dl-metric-val">
                    {val != null ? val.toFixed(1) : '—'}
                  </div>
                  <Sparkline values={series} />
                  <div className="dl-metric-avg">Avg: {avg(key)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Readings table */}
        {readings.length > 0 && (
          <>
            <h2 className="dl-section-title">Recent Readings</h2>
            <div className="dl-table-wrap card">
              <table className="dl-table">
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
                  {readings.slice(0, 15).map(r => (
                    <tr key={r.id}>
                      <td>{new Date(r.timestamp).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td>{r.soil_ph?.toFixed(1) ?? '—'}</td>
                      <td>{r.humidity?.toFixed(0) ?? '—'}%</td>
                      <td>{r.temperature?.toFixed(1) ?? '—'}°C</td>
                      <td>{r.soil_moisture?.toFixed(0) ?? '—'}%</td>
                      <td>{r.nitrogen?.toFixed(0) ?? '—'}</td>
                      <td>{r.phosphorus?.toFixed(0) ?? '—'}</td>
                      <td>{r.potassium?.toFixed(0) ?? '—'}</td>
                      <td>{r.pesticide_level?.toFixed(2) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {readings.length === 0 && !loading && (
          <div className="dl-empty card">
            <span>📊</span>
            <p>No sensor readings yet. Start logging from the Farm AI dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
