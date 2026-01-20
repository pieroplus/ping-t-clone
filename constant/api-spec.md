# API仕様書 - Ping-T Clone Backend

## Base URL

- 開発: `http://localhost:8000`
- 本番: `https://your-app.onrender.com`

## 認証

### ユーザー登録

```http
POST /api/auth/register/
{
  "username": "user",
  "email": "user@example.com",
  "password": "pass1234",
  "password2": "pass1234",
  "image": null
}
→ 201 Created
{
  "id": 1,
  "username": "user",
  "email": "user@example.com",
  "image": null
}
```

**バリデーション**:
- `username`: 必須、重複不可
- `email`: 必須、重複不可、有効なメールアドレス形式
- `password`: 必須、8文字以上
- `password2`: 必須、`password`と一致すること
- `image`: 任意（ImageField）

**エラー例**:
```json
{ "username": ["このユーザー名は既に使用されています。"] }
{ "email": ["このメールアドレスは既に使用されています。"] }
{ "email": ["有効なメールアドレスを入力してください。"] }
{ "password": ["パスワードは8文字以上で入力してください。"] }
{ "password2": ["パスワードが一致しません。"] }
```

### JWT認証

```http
POST /api/token/
{ "email": "user@example.com", "password": "pass1234" }
→ 200 OK
{ "access": "eyJ0eXAiOiJKV1QiLCJhbGc...", "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..." }

POST /api/token/refresh/
{ "refresh": "..." }
→ { "access": "..." }
```

**認証方法**:
- **ログイン**: メールアドレス + パスワードで認証（usernameでは認証できません）
- **フィールド**: `email` と `password` を使用

**使い方**:
```http
Authorization: Bearer <access_token>
```

**エラー例**:
```json
{ "detail": "メールアドレスまたはパスワードが正しくありません。" }
{ "detail": "このアカウントは無効化されています。" }
{ "email": ["メールアドレスは必須です。"] }
{ "password": ["パスワードは必須です。"] }
```

### 現在のユーザー情報取得

```http
GET /api/auth/me/
Authorization: Bearer <access_token>
→ 200 OK
{
  "id": 1,
  "username": "user",
  "email": "user@example.com",
  "image": null
}
```

**権限**: 認証必須

**説明**: ログイン中のユーザーの情報を取得します。フロントエンドでユーザー名を表示する際に使用します。

**エラー例**:
```json
{ "detail": "認証が必要です。ログインしてください。" }
```

## ステータス管理（タイトル単位のみ）

- `draft`: 下書き（所有者のみ）
- `private`: 非公開（所有者のみ、完成済み）
- `public`: 公開（全員閲覧可能）

## 権限マトリックス

| エンドポイント | 匿名 | ログイン | 所有者 |
|--------------|------|---------|--------|
| タイトル一覧 | 公開のみ | 公開+自分（全status） | - |
| タイトル作成 | ❌ | ✅ | - |
| タイトル編集・削除 | ❌ | ❌ | ✅ |
| 問題一覧 | 公開タイトルの問題のみ | 公開+自分 | - |
| 問題作成・編集・削除 | ❌ | ❌ | タイトル所有者 ✅ |
| お気に入り追加 | ❌ | ✅（公開のみ） | - |
| 評価投稿 | ❌ | ✅（公開のみ） | - |
| 問題メモ | ❌ | ✅（本人のみ） | - |

---

## エンドポイント一覧

### タイトル（Titles）

#### `GET /api/quiz/titles/`
- **権限**: 匿名OK（公開のみ）、ログイン時は自分のも含む
- **Query**: `?page=2&page_size=30` (10-50、デフォルト20)
- **Response**:
```json
{
  "count": 10,
  "results": [{
    "id": 1,
    "name": "AWS認定試験対策",
    "status": "public",
    "owner": { "id": 1, "username": "user", "image": "..." },
    "questions_count": 50,
    "average_rating": 4.5
  }]
}
```

#### `POST /api/quiz/titles/`
- **権限**: 認証必須
- **Body**: `{ "name": "...", "description": "...", "status": "draft" }`
- **Response**: `201 Created`

#### `GET /api/quiz/titles/{id}/`
- **権限**: 公開は全員、非公開/下書きは所有者のみ
- **Response**: タイトル詳細（問題一覧含む）

#### `PATCH /api/quiz/titles/{id}/`
- **権限**: 所有者のみ
- **Body**: `{ "name": "...", "status": "public" }`

#### `DELETE /api/quiz/titles/{id}/`
- **権限**: 所有者のみ

#### `GET /api/quiz/titles/{id}/questions/`
- **権限**: 公開は全員、非公開/下書きは所有者のみ
- **Query**: `?random=true` (ランダム順序)

---

### 問題（Questions）

#### `GET /api/quiz/questions/`
- **権限**: 匿名OK（公開タイトルの問題のみ）、ログイン時は自分のも含む
- **Query**: `?page=2&page_size=30&random=true`

#### `POST /api/quiz/questions/`
- **権限**: タイトルの所有者のみ
- **Body**:
```json
{
  "title_id": 1,
  "text": "問題文",
  "question_type": "single",
  "explanation": "解説文（任意）",
  "order": 0,
  "choices": [
    { "text": "選択肢1", "is_correct": true, "order": 1 },
    { "text": "選択肢2", "is_correct": false, "order": 2 }
  ]
}
```
- **バリデーション**:
  - 選択肢: 最低2つ、最大5つ
  - single: 正解1つのみ
  - multiple: 正解2つ以上
  - explanation: 任意フィールド
- **自動採番**: `order`未指定または0の場合、`max(order)+1`を自動設定

#### `GET /api/quiz/questions/{id}/`
- **権限**: 公開タイトルの問題は全員、非公開は所有者のみ

#### `PATCH /api/quiz/questions/{id}/`
- **権限**: タイトルの所有者のみ
- **Body**: POST と同様（全フィールド任意、explanation 含む）

#### `DELETE /api/quiz/questions/{id}/`
- **権限**: タイトルの所有者のみ

#### `POST /api/quiz/questions/{id}/check/`
- **権限**: 認証必須（公開タイトルはOK、非公開/下書きは所有者のみ）
- **説明**: 回答を採点し、正誤判定と正解の選択肢IDを返す
- **Body**:
```json
{
  "selected_choice_ids": [1, 3]
}
```
- **Response**: `200 OK`
```json
{
  "question_id": 1,
  "selected_choice_ids": [1, 3],
  "is_correct": false,
  "explanation": "これは解説です",
  "correct_choice_ids": [2, 4]
}
```
- **バリデーション**:
  - 選択肢は当該問題のもの
  - single: 選択肢1つ必須
  - multiple: 選択肢1つ以上必須
- **エラー例**:
  - 単一選択で複数選択: `{"selected_choice_ids": ["単一選択の問題では、選択肢を1つだけ選択してください。"]}`
  - 無効な選択肢ID: `{"selected_choice_ids": "無効な選択肢IDが含まれています: [99]"}`
  - 他の問題の選択肢: `{"selected_choice_ids": "無効な選択肢IDが含まれています: [5]"}`
  - 非公開問題（非所有者）: `{"detail": "この問題にアクセスする権限がありません。"}`

---

### 問題メモ（Question Notes）

#### `GET /api/quiz/questions/{id}/note/`
- **権限**: 認証必須（本人のメモのみ）

#### `POST /api/quiz/questions/{id}/note/`
- **権限**: 認証必須
- **Body**: `{ "note": "メモ内容" }`

#### `PUT /api/quiz/questions/{id}/note/`
- **権限**: 認証必須（本人のみ）
- **Body**: `{ "note": "更新後のメモ" }`

#### `DELETE /api/quiz/questions/{id}/note/`
- **権限**: 認証必須（本人のみ）

#### `GET /api/quiz/notes/`
- **権限**: 認証必須（自分のメモ一覧）

---

### 問題集のお気に入り（Title Favorites）

#### `GET /api/quiz/favorites/titles/`
- **権限**: 認証必須（自分のお気に入りのみ）

#### `POST /api/quiz/favorites/titles/`
- **権限**: 認証必須（公開タイトルのみ）
- **Body**: `{ "title_id": 1 }`
- **制約**: `UNIQUE(user_id, title_id)` - 重複不可

#### `DELETE /api/quiz/favorites/titles/{id}/`
- **権限**: 認証必須（本人のみ）

---

### 問題のお気に入り（Question Favorites）

#### `GET /api/quiz/favorites/questions/`
- **権限**: 認証必須（自分のお気に入りのみ）

#### `POST /api/quiz/favorites/questions/`
- **権限**: 認証必須（公開タイトルの問題のみ）
- **Body**: `{ "question_id": 5 }`
- **制約**: `UNIQUE(user_id, question_id)` - 重複不可

#### `DELETE /api/quiz/favorites/questions/{id}/`
- **権限**: 認証必須（本人のみ）

---

### 評価（Ratings）

#### `GET /api/quiz/ratings/`
- **権限**: 匿名OK（公開タイトルの評価のみ）

#### `POST /api/quiz/ratings/`
- **権限**: 認証必須（公開タイトルのみ）
- **Body**: `{ "title_id": 1, "stars": 5, "comment": "..." }`
- **バリデーション**: `stars` は 1〜5
- **制約**: `UNIQUE(user_id, title_id)` - 更新可能

#### `PATCH /api/quiz/ratings/{id}/`
- **権限**: 認証必須（本人のみ）

#### `DELETE /api/quiz/ratings/{id}/`
- **権限**: 認証必須（本人のみ）

---

## エラー一覧

### 401 Unauthorized
```json
{ "detail": "認証が必要です。ログインしてください。" }
```
**対処**: `Authorization: Bearer <token>` ヘッダーを付ける

### 403 Forbidden
```json
{ "detail": "この操作を実行する権限がありません。" }
```
**対処**: 自分が所有者のリソースのみ編集、公開タイトルのみお気に入り・評価

### 404 Not Found
```json
{ "detail": "指定されたリソースが見つかりません。" }
```
**対処**: 正しいIDを指定、非公開タイトルは所有者のみアクセス可

### 400 Bad Request（バリデーションエラー）

#### 選択肢不足
```json
{ "choices": ["選択肢は最低2つ必要です。"] }
```

#### 単一選択で正解が複数
```json
{ "question_type": ["単一選択の場合、正解は1つだけ設定してください。"] }
```

#### 複数選択で正解が1つのみ
```json
{ "question_type": ["複数選択の場合、正解は2つ以上設定してください。"] }
```

#### 星評価が範囲外
```json
{ "stars": ["星評価は1〜5の範囲で指定してください。"] }
```

#### 必須フィールドが欠けている
```json
{ "name": ["タイトル名は必須です。"] }
```

---

## 実装済み機能

- ✅ カスタムユーザーモデル（AbstractUser + image）
- ✅ ステータス管理（draft/private/public）
- ✅ お気に入り分割（TitleFavorite / QuestionFavorite）
- ✅ ページネーション（10-50件、デフォルト20）
- ✅ 問題の順序の自動採番
- ✅ ランダムモード（`?random=true`）
- ✅ 日本語エラーメッセージ
- ✅ 採点API（`POST /api/quiz/questions/{id}/check/`）

## 今後の検討事項

1. タイトル統計情報の計算タイミング（現状は動的計算、大量データ時はキャッシュ検討）
2. Favorite/Ratingの削除（現状はID、`title_id`で削除できる方が便利か？）
