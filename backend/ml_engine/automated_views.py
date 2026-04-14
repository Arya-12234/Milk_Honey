from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Farm
from .automated_models import AutomatedAction, ActionLog


class AutomatedActionSerializer(serializers.ModelSerializer):
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AutomatedAction
        fields = '__all__'
        read_only_fields = ['farm', 'last_triggered', 'updated_at']


class ActionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionLog
        fields = '__all__'


class AutomatedActionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        farm_id = request.query_params.get('farm')
        qs = AutomatedAction.objects.filter(farm__user=request.user)
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        return Response(AutomatedActionSerializer(qs, many=True).data)

    def post(self, request):
        """Create or update an automated action for a farm."""
        farm_id = request.data.get('farm')
        action_type = request.data.get('action_type')
        try:
            farm = Farm.objects.get(id=farm_id, user=request.user)
        except Farm.DoesNotExist:
            return Response({'error': 'Farm not found.'}, status=status.HTTP_404_NOT_FOUND)

        obj, _ = AutomatedAction.objects.get_or_create(
            farm=farm, action_type=action_type,
            defaults={'is_enabled': False, 'status': 'idle'}
        )
        serializer = AutomatedActionSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ToggleActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            action = AutomatedAction.objects.get(pk=pk, farm__user=request.user)
        except AutomatedAction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        action.is_enabled = not action.is_enabled
        action.status = 'running' if action.is_enabled else 'idle'
        action.save()

        ActionLog.objects.create(
            action=action,
            note=f"{'Enabled' if action.is_enabled else 'Disabled'} by {request.user.email}",
        )
        return Response(AutomatedActionSerializer(action).data)


class ManualOverrideView(APIView):
    """Trigger an action manually (Start/Stop irrigation, fertiliser, pesticide)."""
    permission_classes = [IsAuthenticated]

    ACTION_LABELS = {
        'irrigation':    ('Start Irrigation', 'Stop Irrigation'),
        'ph_adjustment': ('Apply Fertiliser', 'Stop Fertiliser'),
        'pesticide':     ('Start Pesticide', 'Stop Pesticide'),
    }

    def post(self, request, pk):
        try:
            action = AutomatedAction.objects.get(pk=pk, farm__user=request.user)
        except AutomatedAction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        command = request.data.get('command')   # 'start' or 'stop'
        if command not in ('start', 'stop'):
            return Response({'error': 'command must be start or stop'}, status=400)

        labels = self.ACTION_LABELS.get(action.action_type, ('Start', 'Stop'))
        label = labels[0] if command == 'start' else labels[1]

        action.status = 'running' if command == 'start' else 'idle'
        action.last_triggered = timezone.now() if command == 'start' else action.last_triggered
        action.last_action_note = f'Manual override: {label}'
        action.save()

        ActionLog.objects.create(
            action=action,
            note=f'Manual override: {label} by {request.user.email}',
            triggered_value=action.current_level,
        )
        return Response(AutomatedActionSerializer(action).data)


class ActionLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        farm_id = request.query_params.get('farm')
        qs = ActionLog.objects.filter(action__farm__user=request.user)
        if farm_id:
            qs = qs.filter(action__farm_id=farm_id)
        return Response(ActionLogSerializer(qs[:50], many=True).data)
