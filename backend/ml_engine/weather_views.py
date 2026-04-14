"""
Weather integration using the free Open-Meteo API.
No API key required. Defaults to Nairobi coordinates.
"""
import urllib.request
import json
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude={lat}&longitude={lon}"
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,"
    "weather_code,precipitation,apparent_temperature"
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,"
    "weather_code,wind_speed_10m_max"
    "&timezone=Africa%2FNairobi&forecast_days=7"
)

WMO_DESCRIPTIONS = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy fog", 51: "Light drizzle", 53: "Drizzle",
    55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Light showers", 81: "Showers", 82: "Heavy showers",
    85: "Snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm + hail", 99: "Thunderstorm + heavy hail",
}

CITY_COORDS = {
    "nairobi":   {"lat": -1.2921, "lon": 36.8219},
    "mombasa":   {"lat": -4.0435, "lon": 39.6682},
    "kisumu":    {"lat": -0.0917, "lon": 34.7679},
    "nakuru":    {"lat": -0.3031, "lon": 36.0800},
    "eldoret":   {"lat":  0.5143, "lon": 35.2698},
}


class WeatherView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        city = request.query_params.get("city", "nairobi").lower()
        coords = CITY_COORDS.get(city, CITY_COORDS["nairobi"])
        cache_key = f"weather_{city}"

        # Cache for 10 minutes to avoid hitting the API on every request
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            url = OPEN_METEO_URL.format(lat=coords["lat"], lon=coords["lon"])
            with urllib.request.urlopen(url, timeout=5) as resp:
                raw = json.loads(resp.read())
        except Exception as exc:
            return Response({"error": f"Weather service unavailable: {exc}"}, status=503)

        current = raw.get("current", {})
        daily   = raw.get("daily", {})

        payload = {
            "city": city.capitalize(),
            "lat": coords["lat"],
            "lon": coords["lon"],
            "current": {
                "temperature":    round(current.get("temperature_2m", 0), 1),
                "feels_like":     round(current.get("apparent_temperature", 0), 1),
                "humidity":       current.get("relative_humidity_2m", 0),
                "wind_speed":     round(current.get("wind_speed_10m", 0), 1),
                "precipitation":  current.get("precipitation", 0),
                "weather_code":   current.get("weather_code", 0),
                "description":    WMO_DESCRIPTIONS.get(current.get("weather_code", 0), "Unknown"),
            },
            "forecast": [
                {
                    "date":        daily["time"][i],
                    "temp_max":    round(daily["temperature_2m_max"][i], 1),
                    "temp_min":    round(daily["temperature_2m_min"][i], 1),
                    "precip":      daily["precipitation_sum"][i],
                    "wind_max":    round(daily["wind_speed_10m_max"][i], 1),
                    "weather_code":daily["weather_code"][i],
                    "description": WMO_DESCRIPTIONS.get(daily["weather_code"][i], "Unknown"),
                }
                for i in range(min(7, len(daily.get("time", []))))
            ],
        }

        cache.set(cache_key, payload, 600)  # 10 min cache
        return Response(payload)


class WeatherCitiesView(APIView):
    """List available Kenyan cities."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(list(CITY_COORDS.keys()))
