import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()


class AuthConsumer(AsyncWebsocketConsumer):
    """
    Real-time WebSocket consumer for auth events.
    Notifies clients of:
    - Email availability check results
    - Registration success
    - Login success/failure
    - Token validation status
    """

    async def connect(self):
        self.room_group_name = f'auth_{self.channel_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.send(json.dumps({
            'type': 'connection_established',
            'message': 'Connected to Milk & Honey Designs auth service'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')

            if msg_type == 'check_email':
                await self.handle_check_email(data)
            elif msg_type == 'validate_token':
                await self.handle_validate_token(data)
            elif msg_type == 'ping':
                await self.send(json.dumps({'type': 'pong'}))
        except json.JSONDecodeError:
            await self.send(json.dumps({'type': 'error', 'message': 'Invalid JSON'}))

    async def handle_check_email(self, data):
        email = data.get('email', '').strip()
        if not email:
            await self.send(json.dumps({'type': 'email_check_result', 'exists': False}))
            return
        exists = await self.email_exists(email)
        await self.send(json.dumps({
            'type': 'email_check_result',
            'email': email,
            'exists': exists,
            'message': 'Email already registered' if exists else 'Email available'
        }))

    async def handle_validate_token(self, data):
        token_str = data.get('token', '')
        try:
            token = AccessToken(token_str)
            user_id = token.get('user_id')
            user = await self.get_user(user_id)
            if user:
                await self.send(json.dumps({
                    'type': 'token_valid',
                    'user_id': user_id,
                    'email': user.email,
                    'full_name': user.full_name
                }))
            else:
                await self.send(json.dumps({'type': 'token_invalid'}))
        except TokenError:
            await self.send(json.dumps({'type': 'token_invalid'}))

    @database_sync_to_async
    def email_exists(self, email):
        return User.objects.filter(email=email).exists()

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
