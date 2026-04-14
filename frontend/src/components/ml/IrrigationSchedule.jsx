import React, { useState, useEffect } from 'react';
import { mlAPI } from '../../services/api';
import './IrrigationSchedule.css';

export default function IrrigationSchedule({ farm }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!farm?.id) return;
    mlAPI.getIrrigationSchedule(farm.id)
      .then(({ data }) => setSchedule(data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [farm]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await mlAPI.forecastIrrigation({ farm: farm.id, days_ahead: 7 });
      setSchedule(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalWater = schedule.reduce((s, i) => s + (i.water_amount_mm || 0), 0);

  return (
    <div className="irr-card card">
      <div className="irr-header">
        <h3>Irrigation Schedule</h3>
        <span className="badge badge-gold">ET₀ Model</span>
      </div>
      <p className="irr-subtitle">
        7-day forecast using Penman-Monteith evapotranspiration and soil moisture depletion.
      </p>

      {fetching ? (
        <div className="irr-loading"><span className="spinner" style={{ borderTopColor: 'var(--gold)' }} /></div>
      ) : schedule.length === 0 ? (
        <div className="irr-empty">
          <span>🌿</span>
          <p>No schedule generated yet.</p>
          <p>Click below to forecast based on current sensor data.</p>
        </div>
      ) : (
        <>
          <div className="irr-summary">
            <div className="irr-stat">
              <span className="irr-stat-num">{schedule.length}</span>
              <span className="irr-stat-label">irrigation events</span>
            </div>
            <div className="irr-stat">
              <span className="irr-stat-num">{totalWater.toFixed(0)}</span>
              <span className="irr-stat-label">total mm needed</span>
            </div>
          </div>

          <div className="irr-timeline">
            {schedule.map((item, i) => (
              <div key={i} className={`irr-event ${item.executed ? 'executed' : ''}`}>
                <div className="irr-date">
                  <span className="irr-day">{new Date(item.recommended_date).toLocaleDateString('en-KE', { weekday: 'short' })}</span>
                  <span className="irr-date-num">{new Date(item.recommended_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="irr-bar-col">
                  <div className="irr-bar-wrap">
                    <div className="irr-bar" style={{ width: `${Math.min(100, (item.water_amount_mm / 40) * 100)}%` }} />
                  </div>
                  <p className="irr-reason">{item.reason}</p>
                </div>
                <div className="irr-amount">
                  <span className="irr-mm">{item.water_amount_mm}</span>
                  <span className="irr-mm-label">mm</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-gold btn-full" onClick={handleGenerate} disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? <><span className="spinner" /> Generating…</> : '↻ Regenerate 7-Day Forecast'}
      </button>
    </div>
  );
}
