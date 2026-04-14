from rest_framework import serializers
from .models import (
    Farm, SensorReading, PlantDiseasePrediction,
    YieldPrediction, IrrigationSchedule, Alert
)


class FarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = '__all__'
        read_only_fields = ['user']


class SensorReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorReading
        fields = '__all__'
        read_only_fields = ['timestamp']


class SensorReadingCreateSerializer(serializers.ModelSerializer):
    """Used when posting a new sensor batch."""
    class Meta:
        model = SensorReading
        exclude = ['timestamp']


class PlantDiseasePredictionSerializer(serializers.ModelSerializer):
    predicted_class_display = serializers.CharField(
        source='get_predicted_class_display', read_only=True
    )

    class Meta:
        model = PlantDiseasePrediction
        fields = '__all__'
        read_only_fields = [
            'user', 'predicted_class', 'confidence',
            'all_probabilities', 'is_healthy', 'recommendation', 'created_at',
        ]


class YieldPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = YieldPrediction
        fields = '__all__'
        read_only_fields = ['created_at']


class IrrigationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = IrrigationSchedule
        fields = '__all__'
        read_only_fields = ['created_at']


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'
        read_only_fields = ['created_at']


class PlantDiseaseUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    farm = serializers.PrimaryKeyRelatedField(
        queryset=Farm.objects.all(), required=False, allow_null=True
    )
