from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """ユーザーシリアライザ"""
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'image']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    """ユーザー登録シリアライザ"""
    username = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=CustomUser.objects.all(),
                message='このユーザー名は既に使用されています。'
            )
        ],
        error_messages={
            'required': 'ユーザー名は必須です。',
            'blank': 'ユーザー名は必須です。',
        }
    )
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=CustomUser.objects.all(),
                message='このメールアドレスは既に使用されています。'
            )
        ],
        error_messages={
            'required': 'メールアドレスは必須です。',
            'blank': 'メールアドレスは必須です。',
            'invalid': '有効なメールアドレスを入力してください。',
        }
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        error_messages={
            'required': 'パスワードは必須です。',
            'blank': 'パスワードは必須です。',
        }
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        error_messages={
            'required': 'パスワード（確認用）は必須です。',
            'blank': 'パスワード（確認用）は必須です。',
        }
    )

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'password2', 'image']
        read_only_fields = ['id']
        extra_kwargs = {
            'image': {
                'required': False,
            }
        }

    def validate_password(self, value):
        """パスワードのバリデーション（8文字以上）"""
        if len(value) < 8:
            raise serializers.ValidationError('パスワードは8文字以上で入力してください。')
        return value

    def validate(self, attrs):
        """パスワードの一致を確認"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                'password2': 'パスワードが一致しません。'
            })
        return attrs

    def create(self, validated_data):
        """ユーザーを作成"""
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            image=validated_data.get('image', None)
        )
        return user
