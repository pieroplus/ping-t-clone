from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import Title, Question, Choice, TitleFavorite, QuestionFavorite, Rating, QuestionNote


class ChoiceSerializer(serializers.ModelSerializer):
    """選択肢シリアライザ"""
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    """問題シリアライザ"""
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'title', 'text', 'explanation', 'question_type', 'order', 'choices', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class QuestionCreateSerializer(serializers.ModelSerializer):
    """問題作成用シリアライザ"""
    text = serializers.CharField(
        error_messages={
            'required': '問題文は必須です。',
            'blank': '問題文を入力してください。',
        }
    )
    choices = ChoiceSerializer(
        many=True,
        error_messages={
            'required': '選択肢は必須です。',
            'null': '選択肢を入力してください。',
        }
    )
    question_type = serializers.ChoiceField(
        choices=Question.QUESTION_TYPE_CHOICES,
        error_messages={
            'required': '問題種別は必須です。',
            'invalid_choice': '有効な問題種別を選択してください。',
        }
    )

    class Meta:
        model = Question
        fields = ['id', 'text', 'explanation', 'question_type', 'order', 'choices']

    def validate_choices(self, value):
        """選択肢のバリデーション"""
        if len(value) < 2:
            raise serializers.ValidationError('選択肢は最低2つ必要です。')
        if len(value) > 5:
            raise serializers.ValidationError('選択肢は最大5つまでです。')

        # 正解の数をチェック
        correct_count = sum(1 for choice in value if choice.get('is_correct', False))
        if correct_count == 0:
            raise serializers.ValidationError('正解の選択肢が1つ以上必要です。')

        return value

    def validate(self, data):
        """問題全体のバリデーション"""
        question_type = data.get('question_type', Question.SINGLE_CHOICE)
        choices = data.get('choices', [])

        correct_count = sum(1 for choice in choices if choice.get('is_correct', False))

        if question_type == Question.SINGLE_CHOICE and correct_count != 1:
            raise serializers.ValidationError({
                'question_type': '単一選択の場合、正解は1つだけ設定してください。'
            })

        if question_type == Question.MULTIPLE_CHOICE and correct_count < 2:
            raise serializers.ValidationError({
                'question_type': '複数選択の場合、正解は2つ以上設定してください。'
            })

        return data

    def create(self, validated_data):
        choices_data = validated_data.pop('choices')
        question = Question.objects.create(**validated_data)

        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)

        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)

        # 問題本体を更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 選択肢を更新（全削除して再作成）
        if choices_data is not None:
            instance.choices.all().delete()
            for choice_data in choices_data:
                Choice.objects.create(question=instance, **choice_data)

        return instance


class TitleSerializer(serializers.ModelSerializer):
    """タイトルシリアライザ（一覧用）"""
    owner = UserSerializer(read_only=True)
    questions_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Title
        fields = ['id', 'name', 'description', 'status', 'owner', 'questions_count', 'average_rating', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_questions_count(self, obj):
        return obj.questions.count()

    def get_average_rating(self, obj):
        ratings = obj.ratings.all()
        if ratings.exists():
            return round(sum(r.stars for r in ratings) / ratings.count(), 1)
        return None


class TitleDetailSerializer(serializers.ModelSerializer):
    """タイトル詳細シリアライザ"""
    owner = UserSerializer(read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)
    questions_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    ratings_count = serializers.SerializerMethodField()

    class Meta:
        model = Title
        fields = ['id', 'name', 'description', 'status', 'owner', 'questions', 'questions_count', 'average_rating', 'ratings_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_questions_count(self, obj):
        return obj.questions.count()

    def get_average_rating(self, obj):
        ratings = obj.ratings.all()
        if ratings.exists():
            return round(sum(r.stars for r in ratings) / ratings.count(), 1)
        return None

    def get_ratings_count(self, obj):
        return obj.ratings.count()


class TitleCreateSerializer(serializers.ModelSerializer):
    """タイトル作成用シリアライザ"""
    name = serializers.CharField(
        max_length=200,
        error_messages={
            'required': 'タイトル名は必須です。',
            'blank': 'タイトル名を入力してください。',
            'max_length': 'タイトル名は200文字以内で入力してください。',
        }
    )
    status = serializers.ChoiceField(
        choices=Title.STATUS_CHOICES,
        error_messages={
            'invalid_choice': '有効なステータスを選択してください。',
        }
    )

    class Meta:
        model = Title
        fields = ['id', 'name', 'description', 'status']


class TitleFavoriteSerializer(serializers.ModelSerializer):
    """問題集のお気に入りシリアライザ"""
    user = UserSerializer(read_only=True)
    title = TitleSerializer(read_only=True)
    title_id = serializers.PrimaryKeyRelatedField(
        queryset=Title.objects.filter(status=Title.PUBLIC),
        source='title',
        write_only=True,
        error_messages={
            'does_not_exist': '指定された問題集が見つかりません。',
            'required': '問題集IDは必須です。',
        }
    )

    class Meta:
        model = TitleFavorite
        fields = ['id', 'user', 'title', 'title_id', 'created_at']
        read_only_fields = ['created_at']


class QuestionFavoriteSerializer(serializers.ModelSerializer):
    """問題のお気に入りシリアライザ"""
    user = UserSerializer(read_only=True)
    question = QuestionSerializer(read_only=True)
    question_id = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.filter(title__status=Title.PUBLIC),
        source='question',
        write_only=True,
        error_messages={
            'does_not_exist': '指定された問題が見つかりません。',
            'required': '問題IDは必須です。',
        }
    )

    class Meta:
        model = QuestionFavorite
        fields = ['id', 'user', 'question', 'question_id', 'created_at']
        read_only_fields = ['created_at']


class RatingSerializer(serializers.ModelSerializer):
    """評価シリアライザ"""
    user = UserSerializer(read_only=True)
    title = TitleSerializer(read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'user', 'title', 'stars', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class RatingCreateSerializer(serializers.ModelSerializer):
    """評価作成用シリアライザ"""
    stars = serializers.IntegerField(
        error_messages={
            'required': '星評価は必須です。',
            'invalid': '星評価は数値で入力してください。',
        }
    )

    class Meta:
        model = Rating
        fields = ['id', 'stars', 'comment']

    def validate_stars(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('星評価は1〜5の範囲で指定してください。')
        return value


class QuestionNoteSerializer(serializers.ModelSerializer):
    """問題メモシリアライザ"""
    user = UserSerializer(read_only=True)
    question = QuestionSerializer(read_only=True)

    class Meta:
        model = QuestionNote
        fields = ['id', 'user', 'question', 'note', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class QuestionNoteCreateSerializer(serializers.ModelSerializer):
    """問題メモ作成用シリアライザ"""
    note = serializers.CharField(
        error_messages={
            'required': 'メモは必須です。',
            'blank': 'メモを入力してください。',
        }
    )

    class Meta:
        model = QuestionNote
        fields = ['id', 'note']


class CheckAnswerSerializer(serializers.Serializer):
    """回答チェック用シリアライザ"""
    selected_choice_ids = serializers.ListField(
        child=serializers.IntegerField(),
        error_messages={
            'required': '選択肢IDのリストは必須です。',
            'null': '選択肢IDのリストを入力してください。',
            'not_a_list': '選択肢IDはリスト形式で入力してください。',
        }
    )

    def validate_selected_choice_ids(self, value):
        """選択肢IDのバリデーション"""
        if not value:
            raise serializers.ValidationError('選択肢を1つ以上選択してください。')

        # 重複チェック
        if len(value) != len(set(value)):
            raise serializers.ValidationError('重複した選択肢IDが含まれています。')

        return value

    def validate(self, data):
        """問題全体のバリデーション"""
        question = self.context.get('question')
        selected_choice_ids = data.get('selected_choice_ids', [])

        # 選択肢が当該問題のものかチェック
        valid_choice_ids = set(question.choices.values_list('id', flat=True))
        invalid_ids = set(selected_choice_ids) - valid_choice_ids
        if invalid_ids:
            raise serializers.ValidationError({
                'selected_choice_ids': f'無効な選択肢IDが含まれています: {list(invalid_ids)}'
            })

        # 単一選択の場合は1つのみ
        if question.question_type == Question.SINGLE_CHOICE and len(selected_choice_ids) != 1:
            raise serializers.ValidationError({
                'selected_choice_ids': '単一選択の問題では、選択肢を1つだけ選択してください。'
            })

        # 複数選択の場合は1つ以上
        if question.question_type == Question.MULTIPLE_CHOICE and len(selected_choice_ids) < 1:
            raise serializers.ValidationError({
                'selected_choice_ids': '複数選択の問題では、選択肢を1つ以上選択してください。'
            })

        return data


class CheckAnswerResponseSerializer(serializers.Serializer):
    """回答チェック結果シリアライザ"""
    question_id = serializers.IntegerField()
    selected_choice_ids = serializers.ListField(child=serializers.IntegerField())
    is_correct = serializers.BooleanField()
    explanation = serializers.CharField(allow_blank=True)
    correct_choice_ids = serializers.ListField(child=serializers.IntegerField())
