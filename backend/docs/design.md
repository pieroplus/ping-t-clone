# 設計書 - Ping-T Clone Backend

## ER図

```
┌──────────────┐
│ CustomUser   │ (AbstractUser + image)
└──────────────┘
      │
      │ 1:N
      ├────────────────────────┐
      │                        │
      ▼                        │
┌─────────────┐                │
│    Title    │                │
│  (問題集)    │                │
│ - status    │ ◄──────┐       │
│ (draft/     │        │       │
│  private/   │  ┌─────────────────┐
│  public)    │  │  TitleFavorite  │◄─┐
└─────────────┘  └─────────────────┘  │
      │                               │
      │ 1:N                           │
      ▼                               │
┌─────────────┐                       │
│  Question   │  ┌──────────────────┐ │
│   (問題)     │  │QuestionFavorite  │◄┤
│ - order     │  └──────────────────┘ │
│   (auto)    │                       │
└─────────────┘                       │
      │                               │
      │ 1:N                           │
      ▼                               │
┌─────────────┐                       │
│   Choice    │                       │
│  (選択肢)    │                       │
└─────────────┘                       │
                                      │
      ┌───────────────────────────────┤
      │                               │
      ▼                               │
┌──────────────┐  ┌──────────────┐   │
│    Rating    │  │QuestionNote  │   │
│   (評価)      │  │ (問題メモ)    │◄──┘
└──────────────┘  └──────────────┘
      ▲                  ▲
      │ N:1              │ N:1
      └──────────────────┴─ CustomUser
```

## テーブル定義

### CustomUser (カスタムユーザー)

| カラム | 型 | 制約 | 備考 |
|-------|-----|------|------|
| username | CharField(150) | UNIQUE | AbstractUser継承 |
| image | ImageField | NULL OK | プロフィール画像 |

**設定**: `AUTH_USER_MODEL = 'accounts.CustomUser'`

---

### Title (問題集)

| カラム | 型 | 制約 | 備考 |
|-------|-----|------|------|
| name | CharField(200) | NOT NULL | - |
| description | TextField | NULL OK | - |
| status | CharField(10) | DEFAULT 'draft' | draft/private/public |
| owner_id | BigInteger | FK(CustomUser) | - |

**ステータス**:
- `draft`: 下書き（所有者のみ）
- `private`: 非公開（所有者のみ、完成済み）
- `public`: 公開（全員閲覧可能）

---

### Question (問題)

| カラム | 型 | 制約 | 備考 |
|-------|-----|------|------|
| title_id | BigInteger | FK(Title) | - |
| text | TextField | NOT NULL | - |
| explanation | TextField | NULL OK | - |
| question_type | CharField(10) | DEFAULT 'single' | single/multiple |
| order | PositiveInteger | DEFAULT 0 | 自動採番（未指定時max+1） |

**問題種別**:
- `single`: 単一選択（正解1つ）
- `multiple`: 複数選択（正解2つ以上）

**特殊機能**:
- **自動採番**: `order`未指定または0の場合、`max(order)+1`を自動設定
- **ランダムモード**: `?random=true`でランダム順序取得

---

### Choice (選択肢)

| カラム | 型 | 制約 | 備考 |
|-------|-----|------|------|
| question_id | BigInteger | FK(Question) | - |
| text | TextField | NOT NULL | - |
| is_correct | Boolean | DEFAULT False | - |
| order | PositiveInteger | DEFAULT 0 | - |

**バリデーション**:
- 選択肢数: **最低2つ、最大5つ**
- 単一選択: 正解は **1つのみ**
- 複数選択: 正解は **2つ以上**

---

### TitleFavorite (問題集のお気に入り)

| カラム | 型 | 制約 | 備考 |
|-------|-----|------|------|
| user_id | BigInteger | FK(CustomUser) | - |
| title_id | BigInteger | FK(Title) | - |

**制約**:
- `UNIQUE(user_id, title_id)`
- 公開タイトル（`status='public'`）のみ登録可能

---

### QuestionFavorite (問題のお気に入り)

| カラム | 型 | 制約 | 備考 |
|-------|-----|------|------|
| user_id | BigInteger | FK(CustomUser) | - |
| question_id | BigInteger | FK(Question) | - |

**制約**:
- `UNIQUE(user_id, question_id)`
- 公開タイトルの問題のみ登録可能

---

### Rating (評価)

| カラム | 型 | 制約 | 備考 |
|-------|-----|------|------|
| user_id | BigInteger | FK(CustomUser) | - |
| title_id | BigInteger | FK(Title) | - |
| stars | Integer | CHECK(1 <= stars <= 5) | - |
| comment | TextField | NULL OK | - |

**制約**:
- `UNIQUE(user_id, title_id)` - 更新可能
- 公開タイトル（`status='public'`）のみ評価可能

---

### QuestionNote (問題メモ)

| カラム | 型 | 制約 | 備考 |
|-------|-----|------|------|
| user_id | BigInteger | FK(CustomUser) | - |
| question_id | BigInteger | FK(Question) | - |
| note | TextField | NOT NULL | - |

**制約**:
- `UNIQUE(user_id, question_id)` - 更新可能
- 本人のみ閲覧・編集可能

---

## 権限マトリックス

| リソース | 一覧取得 | 作成 | 更新・削除 |
|---------|---------|------|-----------|
| **Title** | 匿名: 公開のみ<br>ログイン: 公開+自分（全status） | 認証必須 | 所有者のみ |
| **Question** | 匿名: 公開タイトルの問題<br>ログイン: 公開+自分 | タイトル所有者のみ | タイトル所有者のみ |
| **TitleFavorite** | 自分のみ | 認証必須（公開のみ） | 本人のみ |
| **QuestionFavorite** | 自分のみ | 認証必須（公開のみ） | 本人のみ |
| **Rating** | 全員（公開のみ） | 認証必須（公開のみ） | 本人のみ |
| **QuestionNote** | 自分のみ | 認証必須 | 本人のみ |

## カスケード削除

- **Title削除時**: 関連Question, TitleFavorite, Ratingも削除
- **Question削除時**: 関連Choice, QuestionFavorite, QuestionNoteも削除
- **User削除時**: 関連Title, Favorite, Rating, QuestionNoteも削除

## 技術スタック

- **Django**: 4.2.27
- **DRF**: 3.16.1
- **JWT**: djangorestframework-simplejwt 5.5.1
- **DB**: SQLite (開発) / PostgreSQL (本番)
- **画像**: Pillow 11.1.0

## ページネーション

- **デフォルト**: 20件/ページ
- **範囲**: 10〜50件（`?page_size=30`）
- **実装**: `apps/quiz/pagination.py`

## エラーメッセージ

- **カスタムハンドラー**: `apps/quiz/exceptions.py`
- 全エラーを日本語化
