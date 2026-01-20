from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TitleViewSet, QuestionViewSet, TitleFavoriteViewSet, QuestionFavoriteViewSet,
    RatingViewSet, QuestionNoteViewSet
)

app_name = 'quiz'

router = DefaultRouter()
router.register(r'titles', TitleViewSet, basename='title')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'favorites/titles', TitleFavoriteViewSet, basename='title-favorite')
router.register(r'favorites/questions', QuestionFavoriteViewSet, basename='question-favorite')
router.register(r'ratings', RatingViewSet, basename='rating')
router.register(r'notes', QuestionNoteViewSet, basename='note')

urlpatterns = [
    path('', include(router.urls)),
]
