# M & H Smart Farming — Complete Project

Full-stack Django + React precision agriculture platform with 4 ML models,
real-time WebSockets, Open-Meteo weather, and community forum.

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations accounts ml_engine
python manage.py migrate
daphne -p 8000 milkandhoney.asgi:application
```

### Frontend
```bash
cd frontend && npm install && npm start
```

## ML Models
1. PlantDiseaseClassifier  — ResNet-18 CNN, 10 tomato disease classes
2. YieldPredictor          — Gradient Boosting Regressor, 8 soil features
3. IrrigationForecaster    — Penman-Monteith ET0, 7-day schedule
4. SensorAnomalyDetector   — Isolation Forest, auto-alerts on sensor POST

## All API Endpoints
POST /api/auth/register/         — Create account
POST /api/auth/login/            — Login → JWT
GET  /api/auth/profile/          — Current user
WS   ws://localhost:8000/ws/auth/— Live email check + token validation

GET/POST /api/ml/farms/          — Farm CRUD
POST /api/ml/sensor-readings/    — Log reading (runs anomaly detection)
POST /api/ml/disease/detect/     — ML disease classification
POST /api/ml/yield/              — Yield prediction
POST /api/ml/irrigation/         — 7-day irrigation forecast
GET  /api/ml/alerts/             — Farm alerts
POST /api/ml/actions/<id>/toggle/ — Enable/disable automation
POST /api/ml/actions/<id>/override/— Manual start/stop
GET/POST /api/ml/growth/         — Growth records
GET  /api/ml/weather/            — Open-Meteo live weather
GET  /api/ml/community/          — Community dashboard + AI recs
GET/POST /api/ml/forum/          — Forum posts
GET  /api/ml/dashboard/          — ML summary
POST /api/ml/enquiry/            — Farmer onboarding form
