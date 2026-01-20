from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema, OpenApiExample
from .models import CustomUser


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """メールアドレス認証用のJWTトークン取得シリアライザ"""
    username_field = 'email'

    # OpenAPI用にフィールドを明示的に定義
    email = serializers.EmailField(
        required=True,
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

    def validate(self, attrs):
        """メールアドレスとパスワードで認証"""
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # メールアドレスからユーザーを検索
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError(
                    {'detail': 'メールアドレスまたはパスワードが正しくありません。'},
                    code='authorization'
                )

            # パスワードを検証
            if not user.check_password(password):
                raise serializers.ValidationError(
                    {'detail': 'メールアドレスまたはパスワードが正しくありません。'},
                    code='authorization'
                )

            if not user.is_active:
                raise serializers.ValidationError(
                    {'detail': 'このアカウントは無効化されています。'},
                    code='authorization'
                )

            # トークンを生成
            refresh = self.get_token(user)

            data = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }

            return data
        else:
            raise serializers.ValidationError(
                {'detail': 'メールアドレスとパスワードの両方を入力してください。'},
                code='authorization'
            )


class EmailTokenObtainPairView(TokenObtainPairView):
    """メールアドレス認証用のJWTトークン取得ビュー"""
    serializer_class = EmailTokenObtainPairSerializer

    @extend_schema(
        summary='JWTトークン取得（メール認証）',
        description='メールアドレスとパスワードでJWTトークンを取得します。',
        request=EmailTokenObtainPairSerializer,
        responses={
            200: OpenApiExample(
                '認証成功',
                value={
                    'access': 'eyJ0eXAiOiJKV1QiLCJhbGc...',
                    'refresh': 'eyJ0eXAiOiJKV1QiLCJhbGc...'
                }
            ),
            400: OpenApiExample(
                '認証失敗',
                value={
                    'detail': 'メールアドレスまたはパスワードが正しくありません。'
                }
            )
        },
        tags=['認証']
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
