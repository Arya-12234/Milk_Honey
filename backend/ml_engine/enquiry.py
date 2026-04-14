from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import AllowAny


class Enquiry(models.Model):
    CROP_CHOICES = [
        ('orchards', 'Orchards'),
        ('outdoor_vegetables', 'Outdoor Vegetables'),
        ('greenhouse', 'Greenhouse'),
        ('field_crop', 'Field Crop'),
    ]
    IRRIGATION_CHOICES = [
        ('few_times_year', 'Yes, a few times a year'),
        ('several_times_year', 'Yes, several times a year'),
        ('plan_to_build', 'No, but plan to build an irrigation system'),
        ('no_irrigation', "No, I don't need irrigation to grow"),
    ]

    email = models.EmailField()
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    crop_type = models.CharField(max_length=30, choices=CROP_CHOICES, blank=True)
    varieties = models.CharField(max_length=200, blank=True)
    irrigation = models.CharField(max_length=30, choices=IRRIGATION_CHOICES, blank=True)
    land_hectares = models.CharField(max_length=50, blank=True)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'ml_engine'
        ordering = ['-created_at']

    def __str__(self):
        return f'Enquiry from {self.name} ({self.email})'


class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = '__all__'
        read_only_fields = ['created_at']


class EnquiryView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EnquirySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Thank you! We will be in touch soon.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
