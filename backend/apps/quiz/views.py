from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Q
from .models import Title, Question, Choice, TitleFavorite, QuestionFavorite, Rating, QuestionNote
from .serializers import (
    TitleSerializer, TitleDetailSerializer, TitleCreateSerializer,
    QuestionSerializer, QuestionCreateSerializer,
    TitleFavoriteSerializer, QuestionFavoriteSerializer,
    RatingSerializer, RatingCreateSerializer,
    QuestionNoteSerializer, QuestionNoteCreateSerializer,
    CheckAnswerSerializer, CheckAnswerResponseSerializer
)
from .permissions import (
    IsOwnerOrReadOnly, IsTitleOwnerOrReadOnly, IsOwner,
    CanAccessTitle, CanAccessQuestion, IsPublicTitleOnly
)


class TitleViewSet(viewsets.ModelViewSet):
    """問題集（タイトル）のViewSet"""
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        """公開タイトル + 自分のタイトルを取得"""
        if self.request.user.is_authenticated:
            return Title.objects.filter(
                Q(status=Title.PUBLIC) | Q(owner=self.request.user)
            ).distinct()
        else:
            return Title.objects.filter(status=Title.PUBLIC)

    def get_serializer_class(self):
        """アクションに応じてシリアライザを切り替え"""
        if self.action == 'retrieve':
            return TitleDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TitleCreateSerializer
        return TitleSerializer

    def perform_create(self, serializer):
        """作成時にowner を設定"""
        serializer.save(owner=self.request.user)

    def get_permissions(self):
        """アクションに応じて権限を切り替え"""
        if self.action in ['create']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        return [IsAuthenticatedOrReadOnly()]

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """タイトルに紐づく問題一覧を取得"""
        title = self.get_object()

        # アクセス権限チェック
        if title.status != Title.PUBLIC and (not request.user.is_authenticated or title.owner != request.user):
            return Response({'detail': 'このタイトルにアクセスする権限がありません。'}, status=status.HTTP_403_FORBIDDEN)

        questions = title.questions.all()

        # ランダム表示モード
        if request.query_params.get('random', '').lower() == 'true':
            questions = questions.order_by('?')

        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)


class QuestionViewSet(viewsets.ModelViewSet):
    """問題のViewSet"""
    permission_classes = [IsAuthenticatedOrReadOnly, IsTitleOwnerOrReadOnly]

    def get_queryset(self):
        """公開タイトルの問題 + 自分のタイトルの問題を取得"""
        if self.request.user.is_authenticated:
            queryset = Question.objects.filter(
                Q(title__status=Title.PUBLIC) | Q(title__owner=self.request.user)
            ).distinct()
        else:
            queryset = Question.objects.filter(title__status=Title.PUBLIC)

        # ランダム表示モード
        if self.request.query_params.get('random', '').lower() == 'true':
            queryset = queryset.order_by('?')

        return queryset

    def get_serializer_class(self):
        """アクションに応じてシリアライザを切り替え"""
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateSerializer
        return QuestionSerializer

    def perform_create(self, serializer):
        """作成時にtitleを設定し、orderを自動採番"""
        from django.db.models import Max

        title_id = self.request.data.get('title_id')
        try:
            title = Title.objects.get(id=title_id)
            if title.owner != self.request.user:
                raise Exception('このタイトルに問題を追加する権限がありません。')

            # orderが指定されていない、または0の場合は自動採番
            order = serializer.validated_data.get('order', 0)
            if order == 0:
                max_order = title.questions.aggregate(Max('order'))['order__max']
                next_order = (max_order or 0) + 1
                serializer.save(title=title, order=next_order)
            else:
                serializer.save(title=title)
        except Title.DoesNotExist:
            raise Exception('指定されたタイトルが見つかりません。')

    def get_permissions(self):
        """アクションに応じて権限を切り替え"""
        if self.action in ['create']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsTitleOwnerOrReadOnly()]
        return [IsAuthenticatedOrReadOnly()]

    @action(detail=True, methods=['get', 'post', 'put', 'delete'])
    def note(self, request, pk=None):
        """問題のメモを取得・作成・更新・削除"""
        question = self.get_object()

        # アクセス権限チェック
        if question.title.status != Title.PUBLIC and (not request.user.is_authenticated or question.title.owner != request.user):
            return Response({'detail': 'この問題にアクセスする権限がありません。'}, status=status.HTTP_403_FORBIDDEN)

        if not request.user.is_authenticated:
            return Response({'detail': '認証が必要です。'}, status=status.HTTP_401_UNAUTHORIZED)

        if request.method == 'GET':
            # メモ取得
            try:
                note = QuestionNote.objects.get(user=request.user, question=question)
                serializer = QuestionNoteSerializer(note)
                return Response(serializer.data)
            except QuestionNote.DoesNotExist:
                return Response({'detail': 'メモが見つかりません。'}, status=status.HTTP_404_NOT_FOUND)

        elif request.method == 'POST':
            # メモ作成
            serializer = QuestionNoteCreateSerializer(data=request.data)
            if serializer.is_valid():
                try:
                    serializer.save(user=request.user, question=question)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                except Exception as e:
                    return Response({'detail': 'すでにメモが存在します。'}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method in ['PUT', 'PATCH']:
            # メモ更新
            try:
                note = QuestionNote.objects.get(user=request.user, question=question)
                serializer = QuestionNoteCreateSerializer(note, data=request.data, partial=(request.method == 'PATCH'))
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except QuestionNote.DoesNotExist:
                return Response({'detail': 'メモが見つかりません。'}, status=status.HTTP_404_NOT_FOUND)

        elif request.method == 'DELETE':
            # メモ削除
            try:
                note = QuestionNote.objects.get(user=request.user, question=question)
                note.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            except QuestionNote.DoesNotExist:
                return Response({'detail': 'メモが見つかりません。'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def check(self, request, pk=None):
        """回答を採点する"""
        # get_object()ではなく直接取得（querysetフィルタリングを避ける）
        try:
            question = Question.objects.get(pk=pk)
        except Question.DoesNotExist:
            return Response(
                {'detail': '指定されたリソースが見つかりません。'},
                status=status.HTTP_404_NOT_FOUND
            )

        # アクセス権限チェック: 公開タイトルは全員OK、非公開/下書きは所有者のみ
        if question.title.status != Title.PUBLIC:
            if not request.user.is_authenticated or question.title.owner != request.user:
                return Response(
                    {'detail': 'この問題にアクセスする権限がありません。'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # バリデーション
        serializer = CheckAnswerSerializer(data=request.data, context={'question': question})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        selected_choice_ids = serializer.validated_data['selected_choice_ids']

        # 正解判定
        correct_choice_ids = set(question.choices.filter(is_correct=True).values_list('id', flat=True))
        selected_set = set(selected_choice_ids)

        # 選択した選択肢が全て正解 かつ 正解が全て選択されている
        is_correct = (selected_set == correct_choice_ids)

        # レスポンス作成
        response_data = {
            'question_id': question.id,
            'selected_choice_ids': selected_choice_ids,
            'is_correct': is_correct,
            'explanation': question.explanation or '',
            'correct_choice_ids': list(correct_choice_ids)
        }

        response_serializer = CheckAnswerResponseSerializer(response_data)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class TitleFavoriteViewSet(viewsets.ModelViewSet):
    """問題集のお気に入りのViewSet"""
    serializer_class = TitleFavoriteSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        """自分のお気に入りのみ取得"""
        return TitleFavorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """作成時にuserを設定"""
        serializer.save(user=self.request.user)

    def get_permissions(self):
        """アクションに応じて権限を切り替え"""
        if self.action in ['list', 'create']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwner()]


class QuestionFavoriteViewSet(viewsets.ModelViewSet):
    """問題のお気に入りのViewSet"""
    serializer_class = QuestionFavoriteSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        """自分のお気に入りのみ取得"""
        return QuestionFavorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """作成時にuserを設定"""
        serializer.save(user=self.request.user)

    def get_permissions(self):
        """アクションに応じて権限を切り替え"""
        if self.action in ['list', 'create']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwner()]


class RatingViewSet(viewsets.ModelViewSet):
    """評価のViewSet"""
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwner]

    def get_queryset(self):
        """公開タイトルの評価のみ取得"""
        if self.action == 'list':
            # 一覧取得時は全ての公開タイトルの評価を取得
            return Rating.objects.filter(title__status=Title.PUBLIC)
        else:
            # 詳細・更新・削除時は自分の評価のみ
            if self.request.user.is_authenticated:
                return Rating.objects.filter(user=self.request.user)
            return Rating.objects.none()

    def get_serializer_class(self):
        """アクションに応じてシリアライザを切り替え"""
        if self.action in ['create', 'update', 'partial_update']:
            return RatingCreateSerializer
        return RatingSerializer

    def perform_create(self, serializer):
        """作成時にuserとtitleを設定"""
        title_id = self.request.data.get('title_id')
        try:
            title = Title.objects.get(id=title_id, status=Title.PUBLIC)
            serializer.save(user=self.request.user, title=title)
        except Title.DoesNotExist:
            raise Exception('指定された公開タイトルが見つかりません。')

    def get_permissions(self):
        """アクションに応じて権限を切り替え"""
        if self.action in ['create']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwner()]
        return [IsAuthenticatedOrReadOnly()]


class QuestionNoteViewSet(viewsets.ModelViewSet):
    """問題メモのViewSet"""
    serializer_class = QuestionNoteSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        """自分のメモのみ取得"""
        return QuestionNote.objects.filter(user=self.request.user)

    def get_permissions(self):
        """全アクションで認証と所有者チェックが必要"""
        return [IsAuthenticated(), IsOwner()]
