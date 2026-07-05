from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'new@test.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)

    def test_login(self):
        User.objects.create_user(email='test@test.com', password='testpass123')
        response = self.client.post('/api/auth/login/', {
            'email': 'test@test.com',
            'password': 'testpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_wrong_password(self):
        User.objects.create_user(email='test@test.com', password='testpass123')
        response = self.client.post('/api/auth/login/', {
            'email': 'test@test.com',
            'password': 'wrongpass',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_mismatch_on_register(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'new@test.com',
            'password': 'testpass123',
            'password_confirm': 'different',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
