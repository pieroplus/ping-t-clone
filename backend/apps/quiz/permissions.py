from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    オブジェクトの所有者のみ編集可能、それ以外は読み取りのみ
    """
    def has_object_permission(self, request, view, obj):
        # 読み取り権限（GET, HEAD, OPTIONS）は全員に許可
        if request.method in permissions.SAFE_METHODS:
            return True

        # 書き込み権限は所有者のみ
        return obj.owner == request.user


class IsTitleOwnerOrReadOnly(permissions.BasePermission):
    """
    タイトルの所有者のみ編集可能、それ以外は読み取りのみ
    """
    def has_object_permission(self, request, view, obj):
        # 読み取り権限は全員に許可
        if request.method in permissions.SAFE_METHODS:
            return True

        # 書き込み権限はタイトルの所有者のみ
        return obj.title.owner == request.user


class IsOwner(permissions.BasePermission):
    """
    オブジェクトの所有者のみアクセス可能
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class CanAccessTitle(permissions.BasePermission):
    """
    公開タイトルまたは自分のタイトルのみアクセス可能
    """
    def has_object_permission(self, request, view, obj):
        # 公開タイトルは全員アクセス可能
        if obj.status == 'public':
            return True

        # 非公開タイトルは所有者のみアクセス可能
        return request.user.is_authenticated and obj.owner == request.user


class CanAccessQuestion(permissions.BasePermission):
    """
    公開タイトルの問題または自分のタイトルの問題のみアクセス可能
    """
    def has_object_permission(self, request, view, obj):
        # タイトルが公開されているかチェック
        if obj.title.status == 'public':
            return True

        # 非公開タイトルの問題は所有者のみアクセス可能
        return request.user.is_authenticated and obj.title.owner == request.user


class IsPublicTitleOnly(permissions.BasePermission):
    """
    公開タイトルのみアクセス可能（お気に入り、評価用）
    """
    def has_permission(self, request, view):
        # 作成時のバリデーション用（シリアライザ側でも制限）
        return True

    def has_object_permission(self, request, view, obj):
        # オブジェクトのタイトルが公開されているかチェック
        return obj.title.status == 'public'
