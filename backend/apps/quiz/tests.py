from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import CustomUser
from .models import Title, Question, Choice, TitleFavorite, QuestionFavorite, Rating, QuestionNote


class TitleModelTest(TestCase):
    """タイトルモデルのテスト"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_create_title(self):
        """タイトルの作成テスト"""
        title = Title.objects.create(
            name='テストタイトル',
            description='テスト説明',
            is_public=True,
            owner=self.user
        )
        self.assertEqual(title.name, 'テストタイトル')
        self.assertTrue(title.is_public)
        self.assertEqual(title.owner, self.user)


class QuestionModelTest(TestCase):
    """問題モデルのテスト"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.title = Title.objects.create(
            name='テストタイトル',
            owner=self.user,
            is_public=True
        )

    def test_create_question_with_choices(self):
        """問題と選択肢の作成テスト"""
        question = Question.objects.create(
            title=self.title,
            text='テスト問題文',
            question_type=Question.SINGLE_CHOICE
        )
        Choice.objects.create(question=question, text='選択肢1', is_correct=True, order=1)
        Choice.objects.create(question=question, text='選択肢2', is_correct=False, order=2)

        self.assertEqual(question.choices.count(), 2)
        self.assertEqual(question.choices.filter(is_correct=True).count(), 1)


class TitleAPITest(APITestCase):
    """タイトルAPIのテスト"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass')

    def test_create_title_authenticated(self):
        """認証済みユーザーがタイトルを作成できる"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'APIテストタイトル',
            'description': 'API説明',
            'is_public': True
        }
        response = self.client.post('/api/quiz/titles/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Title.objects.count(), 1)
        self.assertEqual(Title.objects.first().owner, self.user)

    def test_create_title_unauthenticated(self):
        """未認証ユーザーはタイトルを作成できない"""
        data = {
            'name': 'APIテストタイトル',
            'description': 'API説明',
            'is_public': True
        }
        response = self.client.post('/api/quiz/titles/', data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_public_titles(self):
        """公開タイトルの一覧取得"""
        Title.objects.create(name='公開タイトル', owner=self.user, is_public=True)
        Title.objects.create(name='非公開タイトル', owner=self.user, is_public=False)

        response = self.client.get('/api/quiz/titles/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_update_own_title(self):
        """自分のタイトルを更新できる"""
        title = Title.objects.create(name='元のタイトル', owner=self.user, is_public=False)
        self.client.force_authenticate(user=self.user)

        data = {'name': '更新後のタイトル', 'is_public': True}
        response = self.client.patch(f'/api/quiz/titles/{title.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        title.refresh_from_db()
        self.assertEqual(title.name, '更新後のタイトル')
        self.assertTrue(title.is_public)

    def test_cannot_update_others_title(self):
        """他人のタイトルは更新できない"""
        title = Title.objects.create(name='他人のタイトル', owner=self.other_user, is_public=True)
        self.client.force_authenticate(user=self.user)

        data = {'name': '更新しようとする'}
        response = self.client.patch(f'/api/quiz/titles/{title.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class QuestionAPITest(APITestCase):
    """問題APIのテスト"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.title = Title.objects.create(name='テストタイトル', owner=self.user, is_public=True)

    def test_create_question_with_choices(self):
        """問題と選択肢を作成できる"""
        self.client.force_authenticate(user=self.user)
        data = {
            'title_id': self.title.id,
            'text': 'テスト問題',
            'explanation': 'テスト解説',
            'question_type': 'single',
            'order': 1,
            'choices': [
                {'text': '正解', 'is_correct': True, 'order': 1},
                {'text': '不正解1', 'is_correct': False, 'order': 2},
                {'text': '不正解2', 'is_correct': False, 'order': 3},
            ]
        }
        response = self.client.post('/api/quiz/questions/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Question.objects.count(), 1)
        self.assertEqual(Choice.objects.count(), 3)

    def test_cannot_create_question_with_invalid_choices(self):
        """不正な選択肢では問題を作成できない（選択肢1つのみ）"""
        self.client.force_authenticate(user=self.user)
        data = {
            'title_id': self.title.id,
            'text': 'テスト問題',
            'question_type': 'single',
            'choices': [
                {'text': '正解', 'is_correct': True, 'order': 1},
            ]
        }
        response = self.client.post('/api/quiz/questions/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class FavoriteAPITest(APITestCase):
    """お気に入りAPIのテスト"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass')
        self.public_title = Title.objects.create(
            name='公開タイトル',
            owner=self.other_user,
            is_public=True
        )

    def test_add_favorite(self):
        """お気に入りを追加できる"""
        self.client.force_authenticate(user=self.user)
        data = {'title_id': self.public_title.id}
        response = self.client.post('/api/quiz/favorites/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Favorite.objects.count(), 1)

    def test_list_own_favorites(self):
        """自分のお気に入りのみ取得できる"""
        Favorite.objects.create(user=self.user, title=self.public_title)
        self.client.force_authenticate(user=self.user)

        response = self.client.get('/api/quiz/favorites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class RatingAPITest(APITestCase):
    """評価APIのテスト"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass')
        self.public_title = Title.objects.create(
            name='公開タイトル',
            owner=self.other_user,
            is_public=True
        )

    def test_create_rating(self):
        """評価を作成できる"""
        self.client.force_authenticate(user=self.user)
        data = {
            'title_id': self.public_title.id,
            'stars': 5,
            'comment': '素晴らしい問題集です'
        }
        response = self.client.post('/api/quiz/ratings/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Rating.objects.count(), 1)

    def test_cannot_create_invalid_rating(self):
        """不正な星評価は作成できない"""
        self.client.force_authenticate(user=self.user)
        data = {
            'title_id': self.public_title.id,
            'stars': 10,  # 範囲外
            'comment': 'テスト'
        }
        response = self.client.post('/api/quiz/ratings/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CheckAnswerAPITest(APITestCase):
    """回答採点APIのテスト"""

    def setUp(self):
        self.user = CustomUser.objects.create_user(username='testuser', password='testpass')
        self.other_user = CustomUser.objects.create_user(username='otheruser', password='testpass')

        # 公開タイトル（単一選択）
        self.public_title = Title.objects.create(
            name='公開タイトル',
            owner=self.other_user,
            status=Title.PUBLIC
        )
        self.single_question = Question.objects.create(
            title=self.public_title,
            text='単一選択問題',
            explanation='これは単一選択です',
            question_type=Question.SINGLE_CHOICE,
            order=1
        )
        self.single_choice1 = Choice.objects.create(
            question=self.single_question,
            text='正解',
            is_correct=True,
            order=1
        )
        self.single_choice2 = Choice.objects.create(
            question=self.single_question,
            text='不正解',
            is_correct=False,
            order=2
        )

        # 公開タイトル（複数選択）
        self.multiple_question = Question.objects.create(
            title=self.public_title,
            text='複数選択問題',
            explanation='これは複数選択です',
            question_type=Question.MULTIPLE_CHOICE,
            order=2
        )
        self.multi_choice1 = Choice.objects.create(
            question=self.multiple_question,
            text='正解1',
            is_correct=True,
            order=1
        )
        self.multi_choice2 = Choice.objects.create(
            question=self.multiple_question,
            text='正解2',
            is_correct=True,
            order=2
        )
        self.multi_choice3 = Choice.objects.create(
            question=self.multiple_question,
            text='不正解',
            is_correct=False,
            order=3
        )

        # 非公開タイトル
        self.private_title = Title.objects.create(
            name='非公開タイトル',
            owner=self.other_user,
            status=Title.PRIVATE
        )
        self.private_question = Question.objects.create(
            title=self.private_title,
            text='非公開問題',
            question_type=Question.SINGLE_CHOICE,
            order=1
        )
        self.private_choice1 = Choice.objects.create(
            question=self.private_question,
            text='正解',
            is_correct=True,
            order=1
        )
        self.private_choice2 = Choice.objects.create(
            question=self.private_question,
            text='不正解',
            is_correct=False,
            order=2
        )

    def test_check_single_correct(self):
        """単一選択で正解を選択した場合"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': [self.single_choice1.id]}
        response = self.client.post(f'/api/quiz/questions/{self.single_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['question_id'], self.single_question.id)
        self.assertEqual(response.data['selected_choice_ids'], [self.single_choice1.id])
        self.assertTrue(response.data['is_correct'])
        self.assertEqual(response.data['explanation'], 'これは単一選択です')

    def test_check_single_incorrect(self):
        """単一選択で不正解を選択した場合"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': [self.single_choice2.id]}
        response = self.client.post(f'/api/quiz/questions/{self.single_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_correct'])

    def test_check_multiple_correct(self):
        """複数選択で全ての正解を選択した場合"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': [self.multi_choice1.id, self.multi_choice2.id]}
        response = self.client.post(f'/api/quiz/questions/{self.multiple_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_correct'])

    def test_check_multiple_partial(self):
        """複数選択で一部のみ正解を選択した場合"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': [self.multi_choice1.id]}
        response = self.client.post(f'/api/quiz/questions/{self.multiple_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_correct'])

    def test_check_multiple_with_incorrect(self):
        """複数選択で正解と不正解を混在して選択した場合"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': [self.multi_choice1.id, self.multi_choice2.id, self.multi_choice3.id]}
        response = self.client.post(f'/api/quiz/questions/{self.multiple_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_correct'])

    def test_check_single_multiple_choices(self):
        """単一選択で複数の選択肢を送信した場合（エラー）"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': [self.single_choice1.id, self.single_choice2.id]}
        response = self.client.post(f'/api/quiz/questions/{self.single_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('selected_choice_ids', response.data)

    def test_check_invalid_choice_id(self):
        """無効な選択肢IDを送信した場合（エラー）"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': [99999]}
        response = self.client.post(f'/api/quiz/questions/{self.single_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('selected_choice_ids', response.data)

    def test_check_other_question_choice(self):
        """他の問題の選択肢IDを送信した場合（エラー）"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': [self.multi_choice1.id]}
        response = self.client.post(f'/api/quiz/questions/{self.single_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_private_question_by_owner(self):
        """非公開問題を所有者が採点できる"""
        self.client.force_authenticate(user=self.other_user)
        data = {'selected_choice_ids': [self.private_choice1.id]}
        response = self.client.post(f'/api/quiz/questions/{self.private_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_correct'])

    def test_check_private_question_by_non_owner(self):
        """非公開問題を所有者以外が採点できない"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': [self.private_choice1.id]}
        response = self.client.post(f'/api/quiz/questions/{self.private_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_check_unauthenticated(self):
        """未認証ユーザーは採点できない"""
        data = {'selected_choice_ids': [self.single_choice1.id]}
        response = self.client.post(f'/api/quiz/questions/{self.single_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_check_empty_choices(self):
        """選択肢が空の場合（エラー）"""
        self.client.force_authenticate(user=self.user)
        data = {'selected_choice_ids': []}
        response = self.client.post(f'/api/quiz/questions/{self.single_question.id}/check/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
