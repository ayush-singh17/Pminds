from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from notes.models import Note
from folders.models import Folder

User = get_user_model()

class NoteAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
        )
        self.client.force_authenticate(user=self.user)

    def test_create_note(self):
        response = self.client.post('/api/notes/', {
            'title': 'Test Note',
            'content': 'Test content about stoicism',
            'type': 'thought',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Note')

    def test_list_notes_only_returns_own(self):
        other_user = User.objects.create_user(email='other@test.com', password='pass123')
        Note.objects.create(user=other_user, title='Other note', content='x', type='thought')
        Note.objects.create(user=self.user, title='My note', content='y', type='thought')

        response = self.client.get('/api/notes/?unfiled=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'My note')

    def test_delete_note(self):
        note = Note.objects.create(user=self.user, title='To delete', content='x', type='thought')
        response = self.client.delete(f'/api/notes/{note.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(id=note.id).exists())

    def test_unauthenticated_request_rejected(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/notes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_search_notes(self):
        Note.objects.create(user=self.user, title='Stoicism', content='Control', type='thought')
        Note.objects.create(user=self.user, title='Cooking', content='Recipe', type='article')

        response = self.client.get('/api/notes/?search=Stoicism')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Stoicism')
