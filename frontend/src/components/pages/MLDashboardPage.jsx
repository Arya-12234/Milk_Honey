import React, { useState, useEffect } from 'react';
import { mlAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PlantDiseaseDetector from '../ml/PlantDiseaseDetector';
import SensorMonitor from '../ml/SensorMonitor';
import YieldPredictor from '../ml/YieldPredictor';
import IrrigationSchedule from '../ml/IrrigationSchedule';
import GrowthTracking from '../ml/GrowthTracking';
import './MLDashboardPage.css';

const TABS = [
  { id: 'sensors',    label: 'Real-Time Monitoring', icon: '📡' },
  { id: 'disease',    label: 'Plant Disease',         icon: '🔬' },
  { id: 'yield',      label: 'Yield Prediction',      icon: '📈' },
  { id: 'irrigation', label: 'Irrigation',            icon: '💧' },
  { id: 'growth',     label: 'Growth Tracking',       icon: '🌱' },
];

export default function MLDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('sensors');
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFarmForm, setShowFarmForm] = useState(false);
  const [farmForm, setFarmForm] = useState({ name: '', crop_type: 'Tomatoes', area_hectares: 1 });
  const [creatingFarm, setCreatingFarm] = useState(false);

  useEffect(() => {
    Promise.all([
      mlAPI.getFarms(),
      mlAPI.getMLDashboard().catch(() => ({ data: null })),
    ]).then(([farmRes, dashRes]) => {
      setFarms(farmRes.data);
      if (farmRes.data.length > 0) setActiveFarm(farmRes.data[0]);
      setSummary(dashRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    setCreatingFarm(true);
    try {
      const { data } = await mlAPI.createFarm(farmForm);
      setFarms(f => [...f, data]);
      setActiveFarm(data);
      setShowFarmForm(false);
      setFarmForm({ name: '', crop_type: 'Tomatoes', area_hectares: 1 });
    } catch (err) { console.error(err); }
    finally { setCreatingFarm(false); }
  };

  if (loading) {
    return (
      <div className="ml-loading">
        <span className="spinner" style={{ width: 28, height: 28, borderTopColor: 'var(--gold)' }} />
        <p>Loading farm data…</p>
      </div>
    );
  }

  return (
    <div className="ml-dashboard">
      <div className="ml-hero">
        <div className="container">
          <div className="ml-hero-inner">
            <div>
              <p className="ml-eyebrow">Smart Farming Platform</p>
              <h1>Welcome, {user?.first_name}</h1>
              <p className="ml-hero-sub">AI-powered monitoring, disease detection &amp; yield forecasting</p>
            </div>
            {summary && (
              <div className="ml-summary-pills">
                <div className="ml-pill">
                  <span className="pill-num">{summary.unread_alerts}</span>
                  <span className="pill-label">Alerts</span>
                </div>
                <div className="ml-pill">
                  <span className="pill-num">{farms.length}</span>
                  <span className="pill-label">Farms</span>
                </div>
                {summary.latest_yield && (
                  <div className="ml-pill">
                    <span className="pill-num">{(summary.latest_yield.predicted_yield_kg_per_ha / 1000).toFixed(1)}t</span>
                    <span className="pill-label">Est. Yield/ha</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container ml-body">
        {/* Farm selector */}
        <div className="farm-selector">
          <div className="farm-tabs">
            {farms.map(f => (
              <button key={f.id}
                className={`farm-tab ${activeFarm?.id === f.id ? 'active' : ''}`}
                onClick={() => setActiveFarm(f)}>
                🌾 {f.name}
                <span className="farm-tab-crop">{f.crop_type}</span>
              </button>
            ))}
            <button className="farm-tab farm-tab-add" onClick={() => setShowFarmForm(!showFarmForm)}>
              + Add Farm
            </button>
          </div>

          {showFarmForm && (
            <form className="farm-form card fade-up" onSubmit={handleCreateFarm}>
              <h4>Register New Farm</h4>
              <div className="farm-form-row">
                <div className="field">
                  <label>Farm Name</label>
                  <input value={farmForm.name} onChange={e => setFarmForm(f => ({ ...f, name: e.target.value }))} placeholder="My Farm" required />
                </div>
                <div className="field">
                  <label>Crop Type</label>
                  <input value={farmForm.crop_type} onChange={e => setFarmForm(f => ({ ...f, crop_type: e.target.value }))} placeholder="Tomatoes" />
                </div>
                <div className="field">
                  <label>Area (hectares)</label>
                  <input type="number" min="0.1" step="0.1" value={farmForm.area_hectares} onChange={e => setFarmForm(f => ({ ...f, area_hectares: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={creatingFarm}>
                  {creatingFarm ? 'Creating…' : 'Create Farm'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowFarmForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {farms.length === 0 ? (
          <div className="ml-empty-state card">
            <span>🌾</span>
            <h3>No farms yet</h3>
            <p>Create your first farm to start monitoring with AI.</p>
            <button className="btn btn-gold" onClick={() => setShowFarmForm(true)}>+ Add Your First Farm</button>
          </div>
        ) : (
          <>
            <div className="ml-tabs">
              {TABS.map(t => (
                <button key={t.id}
                  className={`ml-tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            <div className="ml-tab-content fade-up">
              {tab === 'sensors'    && <SensorMonitor farm={activeFarm} />}
              {tab === 'disease'    && <PlantDiseaseDetector farmId={activeFarm?.id} />}
              {tab === 'yield'      && <YieldPredictor farm={activeFarm} />}
              {tab === 'irrigation' && <IrrigationSchedule farm={activeFarm} />}
              {tab === 'growth'     && <GrowthTracking farm={activeFarm} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
