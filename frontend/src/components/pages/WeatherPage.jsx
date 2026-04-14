import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { mlAPI } from '../../services/api';
import './WeatherPage.css';

const WMO_ICON = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌊', 71: '❄️', 73: '❄️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
};

const CITIES = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret'];

export default function WeatherPage() {
  const [city, setCity]     = useState('nairobi');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    mlAPI.getWeather(city)
      .then(({ data }) => setData(data))
      .catch(() => setError('Could not load weather data. Check your connection.'))
      .finally(() => setLoading(false));
  }, [city]);

  const c = data?.current;

  return (
    <DashboardLayout>
      <div className="wx-page">
        <div className="wx-header">
          <h1 className="wx-title">Weather</h1>
          <div className="wx-city-tabs">
            {CITIES.map(ct => (
              <button
                key={ct}
                className={`wx-city-btn ${city === ct ? 'active' : ''}`}
                onClick={() => setCity(ct)}
              >
                {ct.charAt(0).toUpperCase() + ct.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="wx-loading"><span className="spinner" style={{ borderTopColor: '#3AAFA9' }} /></div>}
        {error   && <div className="wx-error">{error}</div>}

        {data && !loading && (
          <>
            {/* Current conditions */}
            <div className="wx-current card">
              <div className="wx-current-main">
                <div className="wx-icon">{WMO_ICON[c.weather_code] || '🌡️'}</div>
                <div>
                  <div className="wx-temp">{c.temperature}°C</div>
                  <div className="wx-desc">{c.description}</div>
                  <div className="wx-feels">Feels like {c.feels_like}°C</div>
                </div>
              </div>
              <div className="wx-current-pills">
                <div className="wx-pill">
                  <span className="wx-pill-label">Humidity</span>
                  <span className="wx-pill-value">{c.humidity}%</span>
                </div>
                <div className="wx-pill">
                  <span className="wx-pill-label">Wind</span>
                  <span className="wx-pill-value">{c.wind_speed} km/h</span>
                </div>
                <div className="wx-pill">
                  <span className="wx-pill-label">Precipitation</span>
                  <span className="wx-pill-value">{c.precipitation} mm</span>
                </div>
              </div>
            </div>

            {/* 7-day forecast */}
            <h2 className="wx-section-title">7-day forecast</h2>
            <div className="wx-forecast-grid">
              {data.forecast.map((day, i) => (
                <div key={day.date} className={`wx-day-card card ${i === 0 ? 'today' : ''}`}>
                  <div className="wx-day-name">
                    {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-KE', { weekday: 'short' })}
                  </div>
                  <div className="wx-day-icon">{WMO_ICON[day.weather_code] || '🌡️'}</div>
                  <div className="wx-day-desc">{day.description}</div>
                  <div className="wx-day-temps">
                    <span className="wx-max">{day.temp_max}°</span>
                    <span className="wx-min">{day.temp_min}°</span>
                  </div>
                  <div className="wx-day-meta">
                    <span>{day.precip}mm</span>
                    <span>{day.wind_max} km/h</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Farming advisory */}
            <div className="wx-advisory card">
              <h3>Farming advisory</h3>
              <div className="advisory-grid">
                <div className="advisory-item">
                  <span className="advisory-icon">💧</span>
                  <div>
                    <strong>Irrigation</strong>
                    <p>
                      {c.humidity > 75
                        ? 'High humidity — reduce irrigation schedule today.'
                        : c.humidity < 50
                        ? 'Low humidity — consider additional irrigation.'
                        : 'Humidity optimal — follow normal irrigation schedule.'}
                    </p>
                  </div>
                </div>
                <div className="advisory-item">
                  <span className="advisory-icon">🌱</span>
                  <div>
                    <strong>Crop conditions</strong>
                    <p>
                      {c.temperature > 30
                        ? 'High temperature — watch for heat stress. Increase soil moisture.'
                        : c.temperature < 15
                        ? 'Cool temperatures — protect sensitive crops overnight.'
                        : 'Temperature is within optimal growing range.'}
                    </p>
                  </div>
                </div>
                <div className="advisory-item">
                  <span className="advisory-icon">🔬</span>
                  <div>
                    <strong>Disease risk</strong>
                    <p>
                      {c.humidity > 80
                        ? 'High humidity increases fungal disease risk — inspect leaves daily.'
                        : 'Disease risk is low under current conditions.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
