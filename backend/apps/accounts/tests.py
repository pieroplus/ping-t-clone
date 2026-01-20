from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import CustomUser


class RegisterViewTestCase(TestCase):
    """ユーザー登録APIのテスト"""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.valid_payload = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass1234',
            'password2': 'testpass1234',
        }

    def test_register_user_success(self):
        """正常系: ユーザー登録が成功する"""
        response = self.client.post(self.register_url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertIn('id', response.data)
        self.assertNotIn('password', response.data)
        self.assertTrue(CustomUser.objects.filter(username='testuser').exists())
        self.assertTrue(CustomUser.objects.filter(email='test@example.com').exists())

    def test_register_user_duplicate_username(self):
        """異常系: 重複したユーザー名で登録できない"""
        CustomUser.objects.create_user(
            username='testuser',
            email='other@example.com',
            password='pass1234'
        )
        response = self.client.post(self.register_url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        self.assertEqual(
            response.data['username'][0],
            'このユーザー名は既に使用されています。'
        )

    def test_register_user_duplicate_email(self):
        """異常系: 重複したメールアドレスで登録できない"""
        CustomUser.objects.create_user(
            username='otheruser',
            email='test@example.com',
            password='pass1234'
        )
        response = self.client.post(self.register_url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertEqual(
            response.data['email'][0],
            'このメールアドレスは既に使用されています。'
        )

    def test_register_user_password_mismatch(self):
        """異常系: パスワードが一致しない"""
        payload = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass1234',
            'password2': 'differentpass',
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password2', response.data)
        self.assertEqual(
            response.data['password2'][0],
            'パスワードが一致しません。'
        )

    def test_register_user_password_too_short(self):
        """異常系: パスワードが8文字未満"""
        payload = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'short',
            'password2': 'short',
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        self.assertEqual(
            response.data['password'][0],
            'パスワードは8文字以上で入力してください。'
        )

    def test_register_user_missing_username(self):
        """異常系: ユーザー名が未入力"""
        payload = {
            'email': 'test@example.com',
            'password': 'testpass1234',
            'password2': 'testpass1234',
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_register_user_missing_email(self):
        """異常系: メールアドレスが未入力"""
        payload = {
            'username': 'testuser',
            'password': 'testpass1234',
            'password2': 'testpass1234',
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_user_invalid_email(self):
        """異常系: 無効なメールアドレス"""
        payload = {
            'username': 'testuser',
            'email': 'invalid-email',
            'password': 'testpass1234',
            'password2': 'testpass1234',
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_user_missing_password(self):
        """異常系: パスワードが未入力"""
        payload = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password2': 'testpass1234',
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_user_without_image(self):
        """正常系: プロフィール画像なしで登録（imageは任意）"""
        payload = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass1234',
            'password2': 'testpass1234',
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertIsNone(response.data['image'])


class TokenObtainPairViewTestCase(TestCase):
    """JWTトークン取得APIのテスト（メール認証）"""

    def setUp(self):
        self.client = APIClient()
        self.token_url = reverse('token_obtain_pair')
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass1234'
        )

    def test_token_obtain_with_email_success(self):
        """正常系: メールアドレスでトークン取得が成功する"""
        payload = {
            'email': 'test@example.com',
            'password': 'testpass1234',
        }
        response = self.client.post(self.token_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_token_obtain_with_username_fails(self):
        """異常系: usernameでは認証できない"""
        payload = {
            'username': 'testuser',
            'password': 'testpass1234',
        }
        response = self.client.post(self.token_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_obtain_with_wrong_email(self):
        """異常系: 存在しないメールアドレス"""
        payload = {
            'email': 'wrong@example.com',
            'password': 'testpass1234',
        }
        response = self.client.post(self.token_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_token_obtain_with_wrong_password(self):
        """異常系: パスワードが間違っている"""
        payload = {
            'email': 'test@example.com',
            'password': 'wrongpass',
        }
        response = self.client.post(self.token_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_token_obtain_missing_email(self):
        """異常系: メールアドレスが未入力"""
        payload = {
            'password': 'testpass1234',
        }
        response = self.client.post(self.token_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_obtain_missing_password(self):
        """異常系: パスワードが未入力"""
        payload = {
            'email': 'test@example.com',
        }
        response = self.client.post(self.token_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_obtain_inactive_user(self):
        """異常系: 無効化されたユーザー"""
        self.user.is_active = False
        self.user.save()
        payload = {
            'email': 'test@example.com',
            'password': 'testpass1234',
        }
        response = self.client.post(self.token_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
