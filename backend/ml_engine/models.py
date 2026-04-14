from django.db import models
from accounts.models import User


class Farm(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farms')
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200, blank=True)
    area_hectares = models.FloatField(default=1.0)
    crop_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} ({self.user.email})'


class SensorReading(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='readings')
    timestamp = models.DateTimeField(auto_now_add=True)
    soil_ph = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)        # %
    temperature = models.FloatField(null=True, blank=True)     # °C
    soil_moisture = models.FloatField(null=True, blank=True)   # %
    nitrogen = models.FloatField(null=True, blank=True)        # mg/kg
    phosphorus = models.FloatField(null=True, blank=True)      # mg/kg
    potassium = models.FloatField(null=True, blank=True)       # mg/kg
    pesticide_level = models.FloatField(null=True, blank=True) # mg/L

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.farm.name} @ {self.timestamp}'


class PlantDiseasePrediction(models.Model):
    RESULT_CHOICES = [
        ('healthy', 'Healthy'),
        ('early_blight', 'Early Blight'),
        ('late_blight', 'Late Blight'),
        ('leaf_mold', 'Leaf Mold'),
        ('bacterial_spot', 'Bacterial Spot'),
        ('septoria_leaf_spot', 'Septoria Leaf Spot'),
        ('spider_mites', 'Spider Mites'),
        ('target_spot', 'Target Spot'),
        ('mosaic_virus', 'Mosaic Virus'),
        ('yellow_leaf_curl', 'Yellow Leaf Curl Virus'),
        ('unknown', 'Unknown'),
    ]
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='disease_predictions', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disease_predictions')
    image = models.ImageField(upload_to='plant_images/')
    predicted_class = models.CharField(max_length=50, choices=RESULT_CHOICES, default='unknown')
    confidence = models.FloatField(default=0.0)          # 0.0 – 1.0
    all_probabilities = models.JSONField(default=dict)   # {class: prob}
    is_healthy = models.BooleanField(default=False)
    recommendation = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class YieldPrediction(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='yield_predictions')
    predicted_yield_kg_per_ha = models.FloatField()
    confidence_low = models.FloatField()
    confidence_high = models.FloatField()
    input_features = models.JSONField(default=dict)  # snapshot of sensor values used
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class IrrigationSchedule(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='irrigation_schedules')
    recommended_date = models.DateField()
    water_amount_mm = models.FloatField()
    reason = models.TextField(blank=True)
    executed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['recommended_date']


class Alert(models.Model):
    SEVERITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')]
    ALERT_TYPES = [
        ('disease', 'Disease Detected'),
        ('soil_ph', 'Soil pH Anomaly'),
        ('humidity', 'Humidity Anomaly'),
        ('pesticide', 'Pesticide Level High'),
        ('irrigation', 'Irrigation Needed'),
        ('yield', 'Yield Risk'),
    ]
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

# Import supplementary models so Django migrations discover them
from .automated_models import AutomatedAction, ActionLog  # noqa
from .growth import GrowthRecord  # noqa
from .enquiry import Enquiry  # noqa

# Community models
from .community import ForumPost, ForumReply, TrainingResource, UserContribution  # noqa
