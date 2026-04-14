from django.db import models
from rest_framework import serializers
from .models import Farm


class GrowthRecord(models.Model):
    STAGE_CHOICES = [
        ('seedling', 'Seedling'),
        ('vegetative', 'Vegetative'),
        ('flowering', 'Flowering'),
        ('fruiting', 'Fruiting'),
        ('harvest', 'Harvest'),
    ]

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='growth_records')
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES)
    plant_height_cm = models.FloatField(null=True, blank=True)
    leaf_count = models.IntegerField(null=True, blank=True)
    health_score = models.FloatField(null=True, blank=True)  # 0-100
    notes = models.TextField(blank=True)
    image = models.ImageField(upload_to='growth/', null=True, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'ml_engine'
        ordering = ['-recorded_at']


class GrowthRecordSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)

    class Meta:
        model = GrowthRecord
        fields = '__all__'
        read_only_fields = ['recorded_at']
