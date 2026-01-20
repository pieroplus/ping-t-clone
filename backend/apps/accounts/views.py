from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiExample
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """ユーザー登録API"""
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        summary='ユーザー登録',
        description='新しいユーザーを登録します。メールアドレス、ユーザー名、パスワードが必須です。',
        request=RegisterSerializer,
        responses={
            201: UserSerializer,
            400: OpenApiExample(
                'バリデーションエラー',
                value={
                    'username': ['このユーザー名は既に使用されています。'],
                    'email': ['このメールアドレスは既に使用されています。'],
                    'password': ['パスワードは8文字以上で入力してください。'],
                    'password2': ['パスワードが一致しません。']
                }
            )
        },
        tags=['認証']
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # UserSerializerでレスポンスを返す
        user_serializer = UserSerializer(user, context={'request': request})
        return Response(user_serializer.data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveAPIView):
    """現在のユーザー情報取得API"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='現在のユーザー情報取得',
        description='認証されたユーザーの情報を取得します。',
        responses={
            200: UserSerializer,
            401: OpenApiExample(
                '認証エラー',
                value={'detail': '認証が必要です。ログインしてください。'}
            )
        },
        tags=['認証']
    )
    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
