from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Farm
from .growth import GrowthRecord, GrowthRecordSerializer


class GrowthTrackingView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        farm_id = request.query_params.get('farm')
        qs = GrowthRecord.objects.filter(farm__user=request.user)
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        return Response(GrowthRecordSerializer(qs[:30], many=True).data)

    def post(self, request):
        farm_id = request.data.get('farm')
        try:
            farm = Farm.objects.get(id=farm_id, user=request.user)
        except Farm.DoesNotExist:
            return Response({'error': 'Farm not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = GrowthRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(farm=farm)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
