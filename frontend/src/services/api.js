import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register:      (data)  => api.post('/auth/register/', data),
  login:         (data)  => api.post('/auth/login/', data),
  logout:        (refresh) => api.post('/auth/logout/', { refresh }),
  checkEmail:    (email) => api.post('/auth/check-email/', { email }),
  getProfile:    ()      => api.get('/auth/profile/'),
  updateProfile: (data)  => api.patch('/auth/profile/', data),
};

export const mlAPI = {
  // Farms
  getFarms:    ()     => api.get('/ml/farms/'),
  createFarm:  (data) => api.post('/ml/farms/', data),
  // Sensors
  postReading: (data)   => api.post('/ml/sensor-readings/', data),
  getReadings: (farmId) => api.get(`/ml/sensor-readings/?farm=${farmId}`),
  // Disease
  detectDisease:    (formData) => api.post('/ml/disease/detect/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDiseaseHistory: ()        => api.get('/ml/disease/history/'),
  // Yield
  predictYield:   (data)   => api.post('/ml/yield/', data),
  getYieldHistory:(farmId) => api.get(`/ml/yield/?farm=${farmId}`),
  // Irrigation
  forecastIrrigation:    (data)   => api.post('/ml/irrigation/', data),
  getIrrigationSchedule: (farmId) => api.get(`/ml/irrigation/?farm=${farmId}`),
  // Alerts
  getAlerts:      (params) => api.get('/ml/alerts/', { params }),
  markAlertRead:  (id)     => api.patch(`/ml/alerts/${id}/`),
  // Actions
  getActions:     (farmId)          => api.get(`/ml/actions/?farm=${farmId}`),
  createAction:   (data)            => api.post('/ml/actions/', data),
  toggleAction:   (id)              => api.post(`/ml/actions/${id}/toggle/`),
  manualOverride: (id, command)     => api.post(`/ml/actions/${id}/override/`, { command }),
  // Growth
  getGrowth:      (farmId) => api.get(`/ml/growth/?farm=${farmId}`),
  addGrowthRecord:(data)   => api.post('/ml/growth/', data),
  // Weather
  getWeather:     (city = 'nairobi') => api.get(`/ml/weather/?city=${city}`),
  getWeatherCities: ()               => api.get('/ml/weather/cities/'),
  // Community
  getCommunityDashboard: ()         => api.get('/ml/community/'),
  getForumPosts:  (params)          => api.get('/ml/forum/', { params }),
  getForumPost:   (id)              => api.get(`/ml/forum/${id}/`),
  createForumPost:(data)            => api.post('/ml/forum/', data),
  replyToPost:    (id, body)        => api.post(`/ml/forum/${id}/`, { body }),
  upvote:         (model, id)       => api.post(`/ml/forum/${model}/${id}/upvote/`),
  getResources:   ()                => api.get('/ml/resources/'),
  // Enquiry
  submitEnquiry:  (data)            => api.post('/ml/enquiry/', data),
  // Dashboard
  getMLDashboard: ()                => api.get('/ml/dashboard/'),
};

export default api;
