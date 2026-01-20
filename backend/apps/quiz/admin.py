from django.contrib import admin
from .models import Title, Question, Choice, TitleFavorite, QuestionFavorite, Rating, QuestionNote


class ChoiceInline(admin.TabularInline):
    """選択肢のインライン"""
    model = Choice
    extra = 2
    fields = ['text', 'is_correct', 'order']


@admin.register(Title)
class TitleAdmin(admin.ModelAdmin):
    """タイトルの管理画面"""
    list_display = ['name', 'owner', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'description', 'owner__username']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = [
        ('基本情報', {'fields': ['name', 'description', 'owner']}),
        ('設定', {'fields': ['status']}),
        ('メタ情報', {'fields': ['created_at', 'updated_at']}),
    ]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    """問題の管理画面"""
    list_display = ['text_short', 'title', 'question_type', 'order', 'created_at']
    list_filter = ['question_type', 'created_at', 'title']
    search_fields = ['text', 'explanation', 'title__name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ChoiceInline]
    fieldsets = [
        ('基本情報', {'fields': ['title', 'text', 'explanation']}),
        ('設定', {'fields': ['question_type', 'order']}),
        ('メタ情報', {'fields': ['created_at', 'updated_at']}),
    ]

    def text_short(self, obj):
        return obj.text[:50]
    text_short.short_description = '問題文'


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    """選択肢の管理画面"""
    list_display = ['text_short', 'question_short', 'is_correct', 'order']
    list_filter = ['is_correct']
    search_fields = ['text', 'question__text']

    def text_short(self, obj):
        return obj.text[:30]
    text_short.short_description = '選択肢'

    def question_short(self, obj):
        return obj.question.text[:30]
    question_short.short_description = '問題'


@admin.register(TitleFavorite)
class TitleFavoriteAdmin(admin.ModelAdmin):
    """問題集のお気に入りの管理画面"""
    list_display = ['user', 'title', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'title__name']
    readonly_fields = ['created_at']


@admin.register(QuestionFavorite)
class QuestionFavoriteAdmin(admin.ModelAdmin):
    """問題のお気に入りの管理画面"""
    list_display = ['user', 'question_short', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'question__text']
    readonly_fields = ['created_at']

    def question_short(self, obj):
        return obj.question.text[:30]
    question_short.short_description = '問題'


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    """評価の管理画面"""
    list_display = ['user', 'title', 'stars', 'comment_short', 'created_at']
    list_filter = ['stars', 'created_at']
    search_fields = ['user__username', 'title__name', 'comment']
    readonly_fields = ['created_at', 'updated_at']

    def comment_short(self, obj):
        return obj.comment[:50] if obj.comment else ''
    comment_short.short_description = 'コメント'


@admin.register(QuestionNote)
class QuestionNoteAdmin(admin.ModelAdmin):
    """問題メモの管理画面"""
    list_display = ['user', 'question_short', 'note_short', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'question__text', 'note']
    readonly_fields = ['created_at', 'updated_at']

    def question_short(self, obj):
        return obj.question.text[:30]
    question_short.short_description = '問題'

    def note_short(self, obj):
        return obj.note[:50]
    note_short.short_description = 'メモ'
