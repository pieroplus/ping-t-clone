from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Title(models.Model):
    """問題集（タイトル）"""
    DRAFT = 'draft'
    PRIVATE = 'private'
    PUBLIC = 'public'
    STATUS_CHOICES = [
        (DRAFT, '下書き'),
        (PRIVATE, '非公開'),
        (PUBLIC, '公開'),
    ]

    name = models.CharField(max_length=200, verbose_name='タイトル名')
    description = models.TextField(blank=True, verbose_name='説明')
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=DRAFT,
        verbose_name='ステータス'
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='titles', verbose_name='作成者')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')

    class Meta:
        verbose_name = '問題集'
        verbose_name_plural = '問題集'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Question(models.Model):
    """問題"""
    SINGLE_CHOICE = 'single'
    MULTIPLE_CHOICE = 'multiple'
    QUESTION_TYPE_CHOICES = [
        (SINGLE_CHOICE, '単一選択'),
        (MULTIPLE_CHOICE, '複数選択'),
    ]

    title = models.ForeignKey(Title, on_delete=models.CASCADE, related_name='questions', verbose_name='問題集')
    text = models.TextField(verbose_name='問題文')
    explanation = models.TextField(blank=True, verbose_name='解説')
    question_type = models.CharField(
        max_length=10,
        choices=QUESTION_TYPE_CHOICES,
        default=SINGLE_CHOICE,
        verbose_name='問題種別'
    )
    order = models.PositiveIntegerField(default=0, verbose_name='表示順')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')

    class Meta:
        verbose_name = '問題'
        verbose_name_plural = '問題'
        ordering = ['title', 'order', 'id']

    def __str__(self):
        return f'{self.title.name} - {self.text[:50]}'


class Choice(models.Model):
    """選択肢"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices', verbose_name='問題')
    text = models.TextField(verbose_name='選択肢テキスト')
    is_correct = models.BooleanField(default=False, verbose_name='正解フラグ')
    order = models.PositiveIntegerField(default=0, verbose_name='表示順')

    class Meta:
        verbose_name = '選択肢'
        verbose_name_plural = '選択肢'
        ordering = ['question', 'order', 'id']

    def __str__(self):
        return f'{self.question.text[:30]} - {self.text[:30]}'


class TitleFavorite(models.Model):
    """問題集のお気に入り"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='title_favorites', verbose_name='ユーザー')
    title = models.ForeignKey(Title, on_delete=models.CASCADE, related_name='favorited_by_users', verbose_name='問題集')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')

    class Meta:
        verbose_name = '問題集のお気に入り'
        verbose_name_plural = '問題集のお気に入り'
        unique_together = ['user', 'title']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.title.name}'


class QuestionFavorite(models.Model):
    """問題のお気に入り"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='question_favorites', verbose_name='ユーザー')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='favorited_by_users', verbose_name='問題')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')

    class Meta:
        verbose_name = '問題のお気に入り'
        verbose_name_plural = '問題のお気に入り'
        unique_together = ['user', 'question']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.question.text[:30]}'


class Rating(models.Model):
    """評価"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings', verbose_name='ユーザー')
    title = models.ForeignKey(Title, on_delete=models.CASCADE, related_name='ratings', verbose_name='問題集')
    stars = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='星評価'
    )
    comment = models.TextField(blank=True, verbose_name='コメント')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')

    class Meta:
        verbose_name = '評価'
        verbose_name_plural = '評価'
        unique_together = ['user', 'title']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.title.name} ({self.stars}★)'


class QuestionNote(models.Model):
    """問題メモ"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='question_notes', verbose_name='ユーザー')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='notes', verbose_name='問題')
    note = models.TextField(verbose_name='メモ')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')

    class Meta:
        verbose_name = '問題メモ'
        verbose_name_plural = '問題メモ'
        unique_together = ['user', 'question']
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.user.username} - {self.question.text[:30]}'
