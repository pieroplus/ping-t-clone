# CLAUDE.md

QuizHubClone Backend - 問題集・クイズサービスのバックエンドAPI

## プロジェクト構成

```
apps/
├── accounts/     # CustomUser (AbstractUser + image)
└── quiz/         # Title, Question, Choice, TitleFavorite, QuestionFavorite, Rating, QuestionNote
config/           # settings.py, urls.py
```

## 環境変数

`.env`ファイルに設定:

```bash
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://...  # 本番のみ（開発はSQLite）
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## よく使うコマンド

```bash
# セットアップ
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# DB操作
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# サーバー起動
python manage.py runserver

# テスト
python manage.py test
```

## 重要な設計判断

### 1. カスタムユーザーモデル

- **モデル**: `apps.accounts.CustomUser` (AbstractUser継承)
- **追加フィールド**: `image` (ImageField) - プロフィール画像
- **設定**: `AUTH_USER_MODEL = 'accounts.CustomUser'`

### 2. ステータス管理（タイトル単位のみ）

- `draft`: 下書き（所有者のみ）
- `private`: 非公開（所有者のみ、完成済み）
- `public`: 公開（全員が閲覧可能）
- **問題単位の公開設定は無し**

### 3. お気に入りの分割

- **TitleFavorite**: 問題集のお気に入り（公開タイトルのみ、Rating可能）
- **QuestionFavorite**: 問題のお気に入り（公開タイトルの問題のみ、Rating不要）
- 両方とも `unique_together` で重複登録を防止

### 4. ページネーション

- **デフォルト**: 20件/ページ
- **範囲**: 10〜50件（`?page_size=30`で変更可能）
- **実装**: `apps/quiz/pagination.py`

### 5. 問題の順序（order）

- **自動採番**: `order`未指定または0の場合、`max(order)+1`を自動設定
- **手動指定**: 明示的に指定すればそれを使用

### 6. ランダムモード

- **クエリパラメータ**: `?random=true`
- **対象**: `/api/quiz/questions/`, `/api/quiz/titles/{id}/questions/`
- **動作**: Django ORM の `order_by('?')` でランダム順序

### 7. 日本語エラーメッセージ

- **実装**: `apps/quiz/exceptions.py` (カスタム例外ハンドラー)
- 全シリアライザに `error_messages` を設定
- 401/403/404エラーを日本語化

### 8. 選択肢の管理

- 問題更新時は選択肢を **全削除→再作成** する方式（シンプルさ優先）

### 9. タイトルの統計情報

- `questions_count`, `average_rating` はシリアライザで **動的計算**
- 大量データ時はキャッシュ検討が必要

### 10. 問題メモのエンドポイント

- 一覧: `/api/quiz/notes/`
- 単一メモ操作: `/api/quiz/questions/{id}/note/`

## バリデーションルール

### Question & Choice

- **選択肢数**: 最低2つ、最大5つ
- **正解数**:
  - `question_type='single'`: 正解は **1つのみ**
  - `question_type='multiple'`: 正解は **2つ以上**

### Rating

- **星評価**: 1〜5の範囲

### TitleFavorite / QuestionFavorite

- **対象**: 公開タイトル（`status='public'`）または公開タイトルの問題のみ

## 権限

### Title

- 一覧: 公開 + 自分のタイトル（全status）
- 作成: 認証必須
- 編集・削除: 所有者のみ

### Question

- 一覧: 公開タイトルの問題 + 自分のタイトルの問題
- 作成・編集・削除: タイトル所有者のみ

### TitleFavorite / QuestionFavorite

- 作成: 公開タイトルのみ、認証必須
- 削除: 本人のみ

### Rating

- 作成: 公開タイトルのみ、認証必須
- 更新・削除: 本人のみ

### QuestionNote

- 全操作: 本人のみ

## 本番環境（Render）

- **WSGI**: gunicorn
- **DB**: PostgreSQL（`DATABASE_URL`環境変数で切り替え）
- **静的ファイル**: `python manage.py collectstatic`
- **マイグレーション**: デプロイ後に `python manage.py migrate`

## API ドキュメント

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **OpenAPIスキーマ**: `http://localhost:8000/api/schema/`
