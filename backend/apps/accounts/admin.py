from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """カスタムユーザー管理画面"""
    fieldsets = UserAdmin.fieldsets + (
        ('追加情報', {'fields': ('image',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('追加情報', {'fields': ('image',)}),
    )
