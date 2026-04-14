from django.db import models
from .models import Farm


class AutomatedAction(models.Model):
    ACTION_TYPES = [
        ('irrigation', 'Irrigation Control'),
        ('ph_adjustment', 'pH Adjustment Control'),
        ('pesticide', 'Pesticide Control'),
    ]
    STATUS_CHOICES = [
        ('idle', 'Idle'),
        ('running', 'Running'),
        ('paused', 'Paused'),
        ('error', 'Error'),
    ]

    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='automated_actions')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    is_enabled = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='idle')

    # Thresholds
    trigger_threshold_low = models.FloatField(null=True, blank=True)
    trigger_threshold_high = models.FloatField(null=True, blank=True)
    current_level = models.FloatField(null=True, blank=True)

    # Logs
    last_triggered = models.DateTimeField(null=True, blank=True)
    last_action_note = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('farm', 'action_type')
        ordering = ['action_type']

    def __str__(self):
        return f'{self.get_action_type_display()} — {self.farm.name}'


class ActionLog(models.Model):
    action = models.ForeignKey(AutomatedAction, on_delete=models.CASCADE, related_name='logs')
    note = models.TextField()
    triggered_value = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
