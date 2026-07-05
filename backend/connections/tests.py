from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from notes.models import Note
from connections.models import Connection

User = get_user_model()

class ConnectionTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='test@test.com', password='pass123')
        self.client.force_authenticate(user=self.user)
        self.note1 = Note.objects.create(user=self.user, title='Note 1', content='Stoicism', type='thought')
        self.note2 = Note.objects.create(user=self.user, title='Note 2', content='Control', type='thought')

    def test_create_connection(self):
        response = self.client.post('/api/connections/', {
            'note_from': str(self.note1.id),
            'note_to': str(self.note2.id),
            'strength': 0.75,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_no_self_connection(self):
        response = self.client.post('/api/connections/', {
            'note_from': str(self.note1.id),
            'note_to': str(self.note1.id),
            'strength': 0.5,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_connections_by_note(self):
        Connection.objects.create(
            user=self.user, note_from=self.note1,
            note_to=self.note2, strength=0.6, ai_generated=True
        )
        response = self.client.get(f'/api/connections/by-note/{self.note1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
