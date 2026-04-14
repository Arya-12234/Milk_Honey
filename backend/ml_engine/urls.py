from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .automated_views import AutomatedActionsView, ToggleActionView, ManualOverrideView, ActionLogsView
from .enquiry import EnquiryView
from .growth_views import GrowthTrackingView
from .weather_views import WeatherView, WeatherCitiesView
from .community import (
    ForumPostListView, ForumPostDetailView,
    CommunityDashboardView, UpvoteView, TrainingResourceListView,
)

router = DefaultRouter()
router.register('farms', views.FarmViewSet, basename='farms')
router.register('sensor-readings', views.SensorReadingViewSet, basename='sensor-readings')

urlpatterns = [
    path('', include(router.urls)),
    path('disease/detect/',   views.PlantDiseaseDetectView.as_view(),        name='disease-detect'),
    path('disease/history/',  views.PlantDiseasePredictionListView.as_view(), name='disease-history'),
    path('yield/',            views.YieldPredictionView.as_view(),            name='yield-predict'),
    path('irrigation/',       views.IrrigationForecastView.as_view(),         name='irrigation-forecast'),
    path('alerts/',           views.AlertListView.as_view(),                  name='alerts'),
    path('alerts/<int:pk>/',  views.AlertListView.as_view(),                  name='alert-detail'),
    path('actions/',                     AutomatedActionsView.as_view(),      name='actions'),
    path('actions/<int:pk>/toggle/',     ToggleActionView.as_view(),          name='action-toggle'),
    path('actions/<int:pk>/override/',   ManualOverrideView.as_view(),        name='action-override'),
    path('action-logs/',                 ActionLogsView.as_view(),            name='action-logs'),
    path('growth/',           GrowthTrackingView.as_view(),                   name='growth'),
    path('weather/',          WeatherView.as_view(),                          name='weather'),
    path('weather/cities/',   WeatherCitiesView.as_view(),                    name='weather-cities'),
    path('forum/',                    ForumPostListView.as_view(),            name='forum-list'),
    path('forum/<int:pk>/',           ForumPostDetailView.as_view(),          name='forum-detail'),
    path('forum/<str:model>/<int:pk>/upvote/', UpvoteView.as_view(),          name='upvote'),
    path('community/',                CommunityDashboardView.as_view(),       name='community'),
    path('resources/',                TrainingResourceListView.as_view(),     name='resources'),
    path('enquiry/',          EnquiryView.as_view(),                          name='enquiry'),
    path('dashboard/',        views.MLDashboardView.as_view(),                name='ml-dashboard'),
]
