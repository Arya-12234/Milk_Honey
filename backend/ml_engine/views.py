import logging
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import (
    Farm, SensorReading, PlantDiseasePrediction,
    YieldPrediction, IrrigationSchedule, Alert
)
from .serializers import (
    FarmSerializer, SensorReadingSerializer, SensorReadingCreateSerializer,
    PlantDiseasePredictionSerializer, YieldPredictionSerializer,
    IrrigationScheduleSerializer, AlertSerializer, PlantDiseaseUploadSerializer
)
from .ml_models import (
    disease_classifier, yield_predictor,
    irrigation_forecaster, anomaly_detector
)

logger = logging.getLogger(__name__)


class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Farm.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SensorReadingViewSet(viewsets.ModelViewSet):
    """
    POST a new sensor reading → runs anomaly detection → creates alerts.
    GET  returns the most recent 100 readings for the user's farms.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return SensorReadingCreateSerializer
        return SensorReadingSerializer

    def get_queryset(self):
        farm_ids = Farm.objects.filter(user=self.request.user).values_list('id', flat=True)
        return SensorReading.objects.filter(farm_id__in=farm_ids)[:100]

    def perform_create(self, serializer):
        reading = serializer.save()
        self._run_anomaly_detection(reading)

    def _run_anomaly_detection(self, reading: SensorReading):
        data = {
            'soil_ph':        reading.soil_ph,
            'humidity':       reading.humidity,
            'temperature':    reading.temperature,
            'soil_moisture':  reading.soil_moisture,
            'nitrogen':       reading.nitrogen,
            'phosphorus':     reading.phosphorus,
            'potassium':      reading.potassium,
            'pesticide_level':reading.pesticide_level,
        }
        alerts = anomaly_detector.detect(data)
        for a in alerts:
            Alert.objects.create(
                farm=reading.farm,
                alert_type=a['alert_type'],
                severity=a['severity'],
                title=a['title'],
                message=a['message'],
            )
        if alerts:
            logger.info("%d alert(s) generated for farm %s", len(alerts), reading.farm)


# ── Plant Disease Detection ────────────────────────────────────────────────────

class PlantDiseaseDetectView(APIView):
    """
    POST multipart/form-data with 'image' field (and optional 'farm' id).
    Returns ML classification result immediately.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = PlantDiseaseUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        image_file = serializer.validated_data['image']
        farm = serializer.validated_data.get('farm')

        # Save prediction record (image stored, ML runs synchronously)
        prediction = PlantDiseasePrediction(
            user=request.user,
            farm=farm,
            image=image_file,
        )
        prediction.save()   # image written to disk

        # Run ML inference
        result = disease_classifier.predict(prediction.image.path)

        # Persist result
        prediction.predicted_class = result['predicted_class']
        prediction.confidence = result['confidence']
        prediction.all_probabilities = result['all_probabilities']
        prediction.is_healthy = result['is_healthy']
        prediction.recommendation = result['recommendation']
        prediction.save()

        # Auto-create alert if disease detected
        if not result['is_healthy'] and farm:
            Alert.objects.create(
                farm=farm,
                alert_type='disease',
                severity='high' if result['confidence'] > 0.7 else 'medium',
                title=f"Disease Detected: {result['predicted_class'].replace('_', ' ').title()}",
                message=(
                    f"Confidence: {result['confidence']*100:.1f}%. "
                    f"{result['recommendation']}"
                ),
            )

        return Response(PlantDiseasePredictionSerializer(prediction).data,
                        status=status.HTTP_201_CREATED)


class PlantDiseasePredictionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PlantDiseasePrediction.objects.filter(user=request.user)[:20]
        return Response(PlantDiseasePredictionSerializer(qs, many=True).data)


# ── Yield Prediction ──────────────────────────────────────────────────────────

class YieldPredictionView(APIView):
    """
    POST {farm_id, soil_ph, humidity, temperature, soil_moisture,
          nitrogen, phosphorus, potassium, pesticide_level}
    Returns predicted yield with confidence interval.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        farm_id = request.data.get('farm')
        try:
            farm = Farm.objects.get(id=farm_id, user=request.user)
        except Farm.DoesNotExist:
            return Response({'error': 'Farm not found.'}, status=status.HTTP_404_NOT_FOUND)

        features = {
            k: float(request.data[k])
            for k in ['soil_ph', 'humidity', 'temperature', 'soil_moisture',
                      'nitrogen', 'phosphorus', 'potassium', 'pesticide_level']
            if k in request.data
        }

        result = yield_predictor.predict(features)

        prediction = YieldPrediction.objects.create(
            farm=farm,
            predicted_yield_kg_per_ha=result['predicted_yield_kg_per_ha'],
            confidence_low=result['confidence_low'],
            confidence_high=result['confidence_high'],
            input_features={**features, 'factors': result.get('factors', {})},
        )

        return Response(YieldPredictionSerializer(prediction).data,
                        status=status.HTTP_201_CREATED)

    def get(self, request):
        farm_id = request.query_params.get('farm')
        qs = YieldPrediction.objects.filter(farm__user=request.user)
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        return Response(YieldPredictionSerializer(qs[:10], many=True).data)


# ── Irrigation Scheduling ─────────────────────────────────────────────────────

class IrrigationForecastView(APIView):
    """
    POST {farm_id, days_ahead (optional, default 7)}
    Uses the latest sensor readings for that farm to generate a schedule.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        farm_id = request.data.get('farm')
        days_ahead = int(request.data.get('days_ahead', 7))
        try:
            farm = Farm.objects.get(id=farm_id, user=request.user)
        except Farm.DoesNotExist:
            return Response({'error': 'Farm not found.'}, status=status.HTTP_404_NOT_FOUND)

        readings = list(
            SensorReading.objects.filter(farm=farm).order_by('timestamp')
            .values('soil_moisture', 'temperature', 'humidity', 'timestamp')[:30]
        )

        schedules_data = irrigation_forecaster.forecast(readings, days_ahead=days_ahead)

        # Persist each schedule
        created = []
        for s in schedules_data:
            obj = IrrigationSchedule.objects.create(
                farm=farm,
                recommended_date=s['recommended_date'],
                water_amount_mm=s['water_amount_mm'],
                reason=s['reason'],
            )
            created.append(obj)

        return Response(IrrigationScheduleSerializer(created, many=True).data,
                        status=status.HTTP_201_CREATED)

    def get(self, request):
        farm_id = request.query_params.get('farm')
        qs = IrrigationSchedule.objects.filter(farm__user=request.user)
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        return Response(IrrigationScheduleSerializer(qs[:14], many=True).data)


# ── Alerts ────────────────────────────────────────────────────────────────────

class AlertListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        farm_id = request.query_params.get('farm')
        qs = Alert.objects.filter(farm__user=request.user)
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        unread_only = request.query_params.get('unread')
        if unread_only == 'true':
            qs = qs.filter(is_read=False)
        return Response(AlertSerializer(qs[:50], many=True).data)

    def patch(self, request, pk):
        """Mark alert as read."""
        try:
            alert = Alert.objects.get(pk=pk, farm__user=request.user)
            alert.is_read = True
            alert.save()
            return Response(AlertSerializer(alert).data)
        except Alert.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


# ── ML Dashboard Summary ──────────────────────────────────────────────────────

class MLDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        farms = Farm.objects.filter(user=request.user)
        farm_ids = farms.values_list('id', flat=True)

        latest_reading = (
            SensorReading.objects.filter(farm_id__in=farm_ids).first()
        )
        unread_alerts = Alert.objects.filter(
            farm_id__in=farm_ids, is_read=False
        ).count()
        latest_disease = (
            PlantDiseasePrediction.objects.filter(user=request.user).first()
        )
        latest_yield = (
            YieldPrediction.objects.filter(farm_id__in=farm_ids).first()
        )
        upcoming_irrigation = (
            IrrigationSchedule.objects.filter(
                farm_id__in=farm_ids, executed=False
            ).first()
        )

        return Response({
            'farms': FarmSerializer(farms, many=True).data,
            'unread_alerts': unread_alerts,
            'latest_sensor': SensorReadingSerializer(latest_reading).data if latest_reading else None,
            'latest_disease': PlantDiseasePredictionSerializer(latest_disease).data if latest_disease else None,
            'latest_yield': YieldPredictionSerializer(latest_yield).data if latest_yield else None,
            'next_irrigation': IrrigationScheduleSerializer(upcoming_irrigation).data if upcoming_irrigation else None,
        })
