from django.contrib import admin
from .models import Farm, SensorReading, PlantDiseasePrediction, YieldPrediction, IrrigationSchedule, Alert


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'crop_type', 'area_hectares', 'location']
    search_fields = ['name', 'user__email']


@admin.register(SensorReading)
class SensorReadingAdmin(admin.ModelAdmin):
    list_display = ['farm', 'timestamp', 'soil_ph', 'humidity', 'temperature', 'soil_moisture', 'pesticide_level']
    list_filter = ['farm']
    ordering = ['-timestamp']


@admin.register(PlantDiseasePrediction)
class PlantDiseasePredictionAdmin(admin.ModelAdmin):
    list_display = ['user', 'farm', 'predicted_class', 'confidence', 'is_healthy', 'created_at']
    list_filter = ['predicted_class', 'is_healthy']
    ordering = ['-created_at']


@admin.register(YieldPrediction)
class YieldPredictionAdmin(admin.ModelAdmin):
    list_display = ['farm', 'predicted_yield_kg_per_ha', 'confidence_low', 'confidence_high', 'created_at']
    ordering = ['-created_at']


@admin.register(IrrigationSchedule)
class IrrigationScheduleAdmin(admin.ModelAdmin):
    list_display = ['farm', 'recommended_date', 'water_amount_mm', 'executed']
    list_filter = ['executed']


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['farm', 'alert_type', 'severity', 'title', 'is_read', 'created_at']
    list_filter = ['severity', 'alert_type', 'is_read']
    ordering = ['-created_at']

from .community import ForumPost, ForumReply, TrainingResource, UserContribution

@admin.register(ForumPost)
class ForumPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'upvotes', 'is_pinned', 'created_at']
    list_filter  = ['category', 'is_pinned']
    search_fields = ['title', 'author__email']

@admin.register(TrainingResource)
class TrainingResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'resource_type', 'is_featured']

@admin.register(UserContribution)
class UserContributionAdmin(admin.ModelAdmin):
    list_display = ['user', 'post_count', 'reply_count', 'helpful_count']
