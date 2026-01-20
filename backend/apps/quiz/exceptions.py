from rest_framework.views import exception_handler
from rest_framework import status


def custom_exception_handler(exc, context):
    """カスタム例外ハンドラー（日本語エラーメッセージ）"""
    response = exception_handler(exc, context)

    if response is not None:
        # 一般的なエラーを日本語化
        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            response.data = {'detail': '認証が必要です。ログインしてください。'}
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            if 'detail' not in response.data:
                response.data = {'detail': 'この操作を実行する権限がありません。'}
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            if 'detail' not in response.data:
                response.data = {'detail': '指定されたリソースが見つかりません。'}

    return response
