import React, { useState, useEffect } from 'react';
import { mlAPI } from '../../services/api';
import './GrowthTracking.css';

const STAGES = ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'];
const STAGE_ICONS = { seedling: '🌱', vegetative: '🌿', flowering: '🌸', fruiting: '🍅', harvest: '🧺' };

export default function GrowthTracking({ farm }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ stage: 'seedling', plant_height_cm: '', leaf_count: '', health_score: '', notes: '' });

  useEffect(() => {
    if (!farm?.id) return;
    mlAPI.getGrowth(farm.id)
      .then(({ data }) => setRecords(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [farm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { farm: farm.id, ...form };
      if (form.plant_height_cm) payload.plant_height_cm = parseFloat(form.plant_height_cm);
      if (form.leaf_count) payload.leaf_count = parseInt(form.leaf_count);
      if (form.health_score) payload.health_score = parseFloat(form.health_score);
      const { data } = await mlAPI.addGrowthRecord(payload);
      setRecords(r => [data, ...r]);
      setShowForm(false);
      setForm({ stage: 'seedling', plant_height_cm: '', leaf_count: '', health_score: '', notes: '' });
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const currentStage = records[0]?.stage || null;
  const currentStageIdx = STAGES.indexOf(currentStage);
  const avgHealth = records.length
    ? (records.filter(r => r.health_score != null).reduce((s, r) => s + r.health_score, 0) /
       records.filter(r => r.health_score != null).length || 0).toFixed(0)
    : null;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><span className="spinner" style={{ borderTopColor: '#1a5c42' }} /></div>;

  return (
    <div className="growth-wrap">
      {/* Stage progress bar */}
      <div className="growth-stages card">
        <p className="growth-stages-title">Growth Stage</p>
        <div className="stage-track">
          {STAGES.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`stage-node ${i <= currentStageIdx ? 'reached' : ''} ${s === currentStage ? 'current' : ''}`}>
                <span className="stage-icon">{STAGE_ICONS[s]}</span>
                <span className="stage-label">{s}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`stage-line ${i < currentStageIdx ? 'reached' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        {avgHealth && (
          <div className="health-summary">
            <span className="health-label">Avg Health Score</span>
            <div className="health-bar-wrap">
              <div className="health-bar" style={{ width: `${avgHealth}%`, background: avgHealth > 70 ? 'var(--success)' : avgHealth > 40 ? '#E67E22' : 'var(--error)' }} />
            </div>
            <span className="health-pct">{avgHealth}/100</span>
          </div>
        )}
      </div>

      {/* Records timeline */}
      {records.length > 0 && (
        <div className="growth-timeline">
          {records.slice(0, 8).map(r => (
            <div key={r.id} className="growth-record card">
              <div className="gr-icon">{STAGE_ICONS[r.stage]}</div>
              <div className="gr-body">
                <div className="gr-header">
                  <span className="gr-stage">{r.stage_display || r.stage}</span>
                  <span className="gr-date">{new Date(r.recorded_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
                </div>
                <div className="gr-stats">
                  {r.plant_height_cm != null && <span>Height: {r.plant_height_cm} cm</span>}
                  {r.leaf_count != null && <span>Leaves: {r.leaf_count}</span>}
                  {r.health_score != null && <span>Health: {r.health_score}/100</span>}
                </div>
                {r.notes && <p className="gr-notes">{r.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {records.length === 0 && (
        <div className="growth-empty">
          <span>🌱</span>
          <p>No growth records yet. Log your first observation below.</p>
        </div>
      )}

      <button className="btn btn-gold" style={{ marginTop: '0.5rem' }} onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : '+ Log Growth Record'}
      </button>

      {showForm && (
        <form className="growth-form card fade-up" onSubmit={handleSubmit}>
          <h4>New Growth Record</h4>
          <div className="growth-form-grid">
            <div className="field">
              <label>Growth Stage</label>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                {STAGES.map(s => <option key={s} value={s}>{STAGE_ICONS[s]} {s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Plant Height (cm)</label>
              <input type="number" min="0" step="0.5" value={form.plant_height_cm} onChange={e => setForm(f => ({ ...f, plant_height_cm: e.target.value }))} placeholder="e.g. 45" />
            </div>
            <div className="field">
              <label>Leaf Count</label>
              <input type="number" min="0" value={form.leaf_count} onChange={e => setForm(f => ({ ...f, leaf_count: e.target.value }))} placeholder="e.g. 12" />
            </div>
            <div className="field">
              <label>Health Score (0–100)</label>
              <input type="number" min="0" max="100" value={form.health_score} onChange={e => setForm(f => ({ ...f, health_score: e.target.value }))} placeholder="e.g. 85" />
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observations, issues, treatments applied..." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><span className="spinner" /> Saving…</> : 'Save Record'}
          </button>
        </form>
      )}
    </div>
  );
}
