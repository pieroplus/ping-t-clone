from rest_framework.pagination import PageNumberPagination


class CustomPageNumberPagination(PageNumberPagination):
    """
    カスタムページネーション
    - デフォルト: 20件/ページ
    - カスタマイズ可能: ?page_size=30
    - 範囲: 10〜50件
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50

    def get_page_size(self, request):
        """ページサイズを取得（範囲制限付き）"""
        page_size = super().get_page_size(request)
        if page_size is not None:
            # 最小値チェック
            if page_size < 10:
                return 10
            # 最大値チェック
            if page_size > 50:
                return 50
        return page_size
