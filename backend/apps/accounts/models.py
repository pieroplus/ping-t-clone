from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """カスタムユーザーモデル"""
    email = models.EmailField(
        verbose_name='メールアドレス',
        unique=True,
        blank=False,
        error_messages={
            'unique': 'このメールアドレスは既に使用されています。',
        }
    )
    image = models.ImageField(
        upload_to='user_images/',
        blank=True,
        null=True,
        verbose_name='プロフィール画像'
    )

    class Meta:
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'

    def __str__(self):
        return self.username
