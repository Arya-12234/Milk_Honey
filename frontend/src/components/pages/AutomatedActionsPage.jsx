import React, { useState, useEffect } from 'react';
import { mlAPI } from '../../services/api';
import './AutomatedActionsPage.css';

const ACTION_CONFIG = {
  irrigation: {
    label: 'Irrigation Control',
    icon: '💧',
    desc: 'Turns irrigation on/off based on soil moisture levels. Prevents under/over-watering.',
    howItWorks: [
      'Soil moisture sensors continuously monitor the ground',
      'When moisture drops below threshold, activates the system',
      'Checks if there is rain forecast — waits if enough water is expected',
      'If conditions are met, triggers the irrigation pump to water crops',
      'Once soil is adequately moist again, the system turns off irrigation',
    ],
    benefits: ['Saves water', 'Prevents over/under-watering', 'Promotes healthy crop growth'],
    startLabel: 'Start Irrigation',
    stopLabel: 'Stop Irrigation',
    unit: '%',
    thresholdLabel: 'Soil Moisture Threshold (%)',
    thresholdDefault: 40,
  },
  ph_adjustment: {
    label: 'pH Adjustment Control',
    icon: '🧪',
    desc: 'Monitors soil pH in real-time and applies fertilisers or neutralising agents automatically.',
    howItWorks: [
      'pH measures the acidity/alkalinity of the soil',
      'When pH moves outside the optimal range the system activates',
      'Checks the inventory for available pH-adjusting substances',
      'Determines the right dose based on soil condition and crop type',
      'Activates a dispenser to apply the correct substance into the soil',
    ],
    benefits: ['Keeps the soil balanced', 'Supports better nutrient absorption', 'Prevents crop damage from pH extremes'],
    startLabel: 'Apply Fertiliser',
    stopLabel: 'Stop Fertiliser',
    unit: 'pH',
    thresholdLabel: 'Optimal pH Range',
    thresholdDefault: 6.5,
  },
  pesticide: {
    label: 'Pesticide Control',
    icon: '🔬',
    desc: 'Detects abnormal chemical changes or pesticide levels and applies pesticides automatically when needed.',
    howItWorks: [
      'Special sensors detect abnormal chemical patterns in the soil or leaves (combined with image recognition in advanced setups)',
      'When pests are detected, the system checks available pesticides in inventory',
      'Selects the correct type and amount based on the pest and crop',
      'Triggers a sprayer to treat only the affected area',
    ],
    benefits: ['Prevents large infestations early', 'Reduces manual spraying', 'Uses precise amounts, reducing chemical waste'],
    startLabel: 'Start Pesticide',
    stopLabel: 'Stop Pesticide',
    unit: 'mg/L',
    thresholdLabel: 'Pesticide Level Threshold (mg/L)',
    thresholdDefault: 0.5,
  },
};

export default function AutomatedActionsPage() {
  const [actions, setActions] = useState({});
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [activeTab, setActiveTab] = useState('irrigation');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});
  const [overriding, setOverriding] = useState({});

  useEffect(() => {
    mlAPI.getFarms().then(({ data }) => {
      setFarms(data);
      if (data.length > 0) setActiveFarm(data[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeFarm) return;
    mlAPI.getActions(activeFarm.id).then(({ data }) => {
      const map = {};
      data.forEach(a => { map[a.action_type] = a; });
      setActions(map);
    }).catch(() => {});
  }, [activeFarm]);

  const handleToggle = async (actionId) => {
    setToggling(t => ({ ...t, [actionId]: true }));
    try {
      const { data } = await mlAPI.toggleAction(actionId);
      setActions(prev => ({ ...prev, [data.action_type]: data }));
    } finally {
      setToggling(t => ({ ...t, [actionId]: false }));
    }
  };

  const handleOverride = async (actionId, command) => {
    setOverriding(o => ({ ...o, [`${actionId}_${command}`]: true }));
    try {
      const { data } = await mlAPI.manualOverride(actionId, command);
      setActions(prev => ({ ...prev, [data.action_type]: data }));
    } finally {
      setOverriding(o => ({ ...o, [`${actionId}_${command}`]: false }));
    }
  };

  const ensureAction = async (type) => {
    if (actions[type]) return actions[type];
    if (!activeFarm) return null;
    try {
      const { data } = await mlAPI.createAction({ farm: activeFarm.id, action_type: type });
      setActions(prev => ({ ...prev, [type]: data }));
      return data;
    } catch { return null; }
  };

  const cfg = ACTION_CONFIG[activeTab];
  const action = actions[activeTab];

  if (loading) {
    return <div className="aa-loading"><span className="spinner" style={{ borderTopColor: '#1a5c42' }} /></div>;
  }

  return (
    <div className="aa-page">
      {/* Hero */}
      <div className="aa-hero">
        <div className="container">
          <h1>Automated Actions</h1>
          <p>Smart systems that monitor, decide, and act — so you don't have to.</p>
        </div>
      </div>

      <div className="container aa-body">
        {/* Farm selector */}
        {farms.length > 0 && (
          <div className="aa-farm-bar">
            {farms.map(f => (
              <button key={f.id}
                className={`farm-chip ${activeFarm?.id === f.id ? 'active' : ''}`}
                onClick={() => setActiveFarm(f)}>
                🌾 {f.name}
              </button>
            ))}
          </div>
        )}

        {/* Tab selector */}
        <div className="aa-tab-selector">
          {Object.entries(ACTION_CONFIG).map(([key, c]) => (
            <button key={key}
              className={`aa-tab-btn ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Main content panel */}
        <div className="aa-content fade-up">
          <div className="aa-panel card">
            <div className="aa-panel-header">
              <div>
                <h2>{cfg.icon} {cfg.label}</h2>
                <p>{cfg.desc}</p>
              </div>
              {action && (
                <div className="aa-toggle-wrap">
                  <span className="aa-status-label">
                    {action.is_enabled
                      ? <span className="status-on">● Enabled</span>
                      : <span className="status-off">○ Disabled</span>}
                  </span>
                  <button
                    className={`toggle-switch ${action.is_enabled ? 'on' : ''}`}
                    onClick={() => handleToggle(action.id)}
                    disabled={toggling[action.id]}>
                    <span className="toggle-knob" />
                  </button>
                </div>
              )}
            </div>

            <div className="aa-two-col">
              {/* Left: key features */}
              <div className="aa-left">
                <h3>How it works</h3>
                <ol className="how-it-works">
                  {cfg.howItWorks.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
                <h3 style={{ marginTop: '1.5rem' }}>Benefits</h3>
                <ul className="benefits-list">
                  {cfg.benefits.map((b, i) => <li key={i}>✓ {b}</li>)}
                </ul>
              </div>

              {/* Right: controls */}
              <div className="aa-right">
                {action ? (
                  <>
                    {/* Level display */}
                    <div className="level-display card">
                      <span className="level-label">{cfg.label}</span>
                      <div className="level-row">
                        <span className="level-text">Automation</span>
                        <span className={`level-badge ${action.is_enabled ? 'enabled' : 'disabled'}`}>
                          {action.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="level-row">
                        <span className="level-text">Status</span>
                        <span className="level-text">{action.status}</span>
                      </div>
                      <div className="level-slider-row">
                        <span className="level-text">{activeTab === 'ph_adjustment' ? 'pH Level' : activeTab === 'irrigation' ? 'Water Level' : 'Pesticide Level'}</span>
                        <div className="level-bar-wrap">
                          <div className="level-bar" style={{ width: `${action.current_level ?? 0}%` }} />
                        </div>
                        <span className="level-pct">{action.current_level ?? 0}{cfg.unit}</span>
                      </div>
                      <div className="level-slider-row">
                        <span className="level-text">Threshold</span>
                        <div className="level-bar-wrap">
                          <div className="level-bar threshold" style={{ width: `${((action.trigger_threshold_low ?? cfg.thresholdDefault) / (activeTab === 'pesticide' ? 2 : 100)) * 100}%` }} />
                        </div>
                        <span className="level-pct">{action.trigger_threshold_low ?? cfg.thresholdDefault}{cfg.unit}</span>
                      </div>
                    </div>

                    {/* Manual override controls */}
                    <div className="override-section">
                      <h4>Manual Override Controls</h4>
                      <div className="override-btns">
                        <button className="btn btn-gold"
                          onClick={() => handleOverride(action.id, 'start')}
                          disabled={overriding[`${action.id}_start`]}>
                          {overriding[`${action.id}_start`] ? '…' : cfg.startLabel}
                        </button>
                        <button className="btn btn-outline"
                          onClick={() => handleOverride(action.id, 'stop')}
                          disabled={overriding[`${action.id}_stop`]}>
                          {overriding[`${action.id}_stop`] ? '…' : cfg.stopLabel}
                        </button>
                      </div>
                      {action.last_action_note && (
                        <p className="last-note">Last: {action.last_action_note}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="aa-no-action card">
                    <p>No action configured yet for this farm.</p>
                    <button className="btn btn-gold"
                      onClick={() => ensureAction(activeTab)}>
                      Enable {cfg.label}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
