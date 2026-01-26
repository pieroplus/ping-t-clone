# QuizHub　Backend

Ping-Tのような問題集・クイズサービスのバックエンドAPI（Django + DRF）

## 技術スタック

- **Django 4.2**: Webフレームワーク
- **Django REST Framework**: REST API構築
- **Simple JWT**: JWT認証
- **drf-spectacular**: OpenAPI/Swagger ドキュメント
- **django-cors-headers**: CORS設定
- **PostgreSQL**: 本番環境のデータベース（Render）
- **SQLite**: 開発環境のデータベース

## ローカル開発環境のセットアップ

### 1. 仮想環境の作成と有効化

```bash
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# または
venv\Scripts\activate  # Windows
```

### 2. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

`.env` ファイルを編集して必要な設定を行う（開発環境ではデフォルト値で動作します）：

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (開発環境では空欄でOK。SQLiteを使用)
DATABASE_URL=

# CORS (Next.jsのURLを設定)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. データベースのマイグレーション

```bash
python manage.py migrate
```

### 5. スーパーユーザーの作成（任意）

```bash
python manage.py createsuperuser
```

### 6. 開発サーバーの起動

```bash
python manage.py runserver
```

サーバーが起動したら、以下のURLにアクセスできます：

- **API ルート**: http://localhost:8000/api/
- **管理画面**: http://localhost:8000/admin/
- **API ドキュメント**: http://localhost:8000/api/docs/
- **OpenAPI スキーマ**: http://localhost:8000/api/schema/

## API エンドポイント

### 認証

- `POST /api/token/` - JWTトークンの取得（ログイン）
- `POST /api/token/refresh/` - JWTトークンのリフレッシュ

### Quiz（今後実装予定）

- `GET /api/quiz/` - 問題集一覧
- その他のエンドポイントは実装次第で追加

## 本番環境（Render）

### 環境変数

Renderの環境変数設定で以下を設定：

```env
SECRET_KEY=本番用の秘密鍵（ランダムな文字列）
DEBUG=False
ALLOWED_HOSTS=your-app.onrender.com
DATABASE_URL=postgres://user:password@host:5432/dbname  # Renderが自動設定
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### デプロイ

Renderでは以下のコマンドを設定：

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn config.wsgi:application`

マイグレーションは自動で実行されないため、初回デプロイ後にRenderのシェルから実行：

```bash
python manage.py migrate
python manage.py createsuperuser
```

## プロジェクト構造

```
backend/
├── apps/
│   └── quiz/          # Quizアプリケーション（問題集機能）
├── config/            # Djangoプロジェクト設定
│   ├── settings.py    # 設定ファイル
│   ├── urls.py        # URLルーティング
│   └── wsgi.py        # WSGI設定
├── manage.py          # Django管理コマンド
├── requirements.txt   # 依存パッケージ
├── .env.example       # 環境変数のサンプル
└── README.md          # このファイル
```

## 開発コマンド

```bash
# マイグレーションファイルの作成
python manage.py makemigrations

# マイグレーションの適用
python manage.py migrate

# テストの実行
python manage.py test

# 静的ファイルの収集（本番環境用）
python manage.py collectstatic

# 開発サーバーの起動
python manage.py runserver

# Djangoシェルの起動
python manage.py shell
```

## ライセンス

MIT
