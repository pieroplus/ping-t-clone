# Ping-T Clone Frontend (Phase A)

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui で構築したクイズアプリケーションのフロントエンド

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (Button, Card, Input, Toast)

## セットアップ

### 環境変数

`.env.local` ファイルを作成し、以下を設定:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### インストールと起動

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## Phase A の実装画面

1. **ユーザー登録** (`/auth/register`)
   - ユーザー名、メールアドレス、パスワード、パスワード確認を入力
   - POST /api/auth/register/ でアカウント作成
   - エンドポイント: `POST /api/auth/register/`
   - 送信フィールド: `{ username, email, password, password2 }`
   - バリデーションエラーはフォーム下に日本語で表示
   - 成功したら /auth/login へリダイレクト

2. **ログイン画面** (`/auth/login`)
   - メールアドレスとパスワードでログイン
   - エンドポイント: `POST /api/token/`
   - 送信フィールド: `{ email, password }`
   - JWT トークンを localStorage に保存
   - ログイン成功後、GET /api/auth/me/ でユーザー情報（username）を取得
   - ログイン後は /titles へリダイレクト
   - 新規登録リンクあり

3. **ログアウト**
   - ヘッダーにユーザー名を表示（ログイン中）
   - ユーザー名クリックでメニュー表示
   - ログアウト実行で localStorage をクリア、/auth/login へ遷移

4. **タイトル一覧** (`/titles`)
   - 公開タイトルの一覧表示
   - ページネーション対応
   - タイトル名、作成者、問題数、平均評価を表示

5. **タイトル詳細** (`/titles/[id]`)
   - タイトルの詳細情報を表示
   - 問題を解く・ランダムに解くボタン
   - 所有者のみ: 編集ボタン、問題追加ボタンを表示

6. **出題モード** (`/titles/[id]/solve`)
   - 1問ずつ表示
   - 単一選択/複数選択に対応
   - 採点機能（Toast で正解/不正解を表示）
   - 解説表示
   - 最後まで解いたら /titles へ戻る

## 作成者向け管理機能

### URL一覧

| 画面 | URL | 必要な権限 |
|------|-----|-----------|
| タイトル作成 | `/titles/new` | 認証必須 |
| タイトル編集 | `/titles/[id]/edit` | 所有者のみ |
| タイトル削除 | `/titles/[id]/edit` (削除ボタン) | 所有者のみ |
| 問題作成 | `/titles/[id]/questions/new` | タイトル所有者のみ |
| 問題編集 | `/titles/[id]/questions/[qid]/edit` | タイトル所有者のみ |
| 問題削除 | `/titles/[id]/edit` または `/titles/[id]/questions/[qid]/edit` | タイトル所有者のみ |

### 権限について

- **認証必須**: ログイン中のユーザーのみアクセス可能
- **所有者のみ**: タイトルの作成者のみアクセス可能（403エラーで担保）
- **フロント側の所有者判定**: localStorage の `username` とタイトルの `owner.username` を比較して、管理ボタンの表示/非表示を切り替え
  - この判定は完全ではないため、実際のアクセス権限はサーバー側で検証され、403エラーで制御される

### 機能詳細

1. **タイトル作成** (`/titles/new`)
   - フォーム: name (必須), description (任意), status (draft/private/public)
   - 成功時: タイトル詳細ページ (`/titles/[id]`) へリダイレクト
   - バリデーションエラーはフォーム下に日本語で表示

2. **タイトル編集** (`/titles/[id]/edit`)
   - タイトル情報の編集フォーム
   - 削除ボタン（確認ダイアログ付き、削除後はトップページへリダイレクト）
   - 問題一覧表示（各問題に編集・削除ボタン）
   - 問題追加ボタン

3. **問題作成** (`/titles/[id]/questions/new`)
   - フォーム: 問題文, 問題タイプ (single/multiple), 選択肢 (2〜5個), 解説 (任意)
   - 各選択肢: テキスト + 正解チェックボックス（チェックボックスの下に「正解」ラベル表示）
   - バリデーション:
     - 選択肢は2〜5個
     - 単一選択: 正解は1つのみ
     - 複数選択: 正解は2つ以上
   - 解説フィールドはフォームの一番下に配置
   - 成功時: タイトル編集ページへリダイレクト

4. **問題編集** (`/titles/[id]/questions/[qid]/edit`)
   - 問題情報の編集フォーム（問題文、問題タイプ、選択肢、解説）
   - 削除ボタン（確認ダイアログ付き）
   - 選択肢の追加・削除が可能
   - 各選択肢に「正解」ラベル付きチェックボックス

## ディレクトリ構成

```
frontend/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx                        # ログイン画面
│   │   └── register/
│   │       └── page.tsx                        # 登録画面
│   ├── titles/
│   │   ├── page.tsx                            # タイトル一覧
│   │   ├── new/
│   │   │   └── page.tsx                        # タイトル作成
│   │   └── [id]/
│   │       ├── page.tsx                        # タイトル詳細
│   │       ├── edit/
│   │       │   └── page.tsx                    # タイトル編集
│   │       ├── solve/
│   │       │   └── page.tsx                    # 出題モード
│   │       └── questions/
│   │           ├── new/
│   │           │   └── page.tsx                # 問題作成
│   │           └── [qid]/edit/
│   │               └── page.tsx                # 問題編集
│   ├── layout.tsx                              # ルートレイアウト
│   ├── page.tsx                                # トップページ（/titles へリダイレクト）
│   └── globals.css                             # グローバルスタイル
├── components/
│   ├── Header.tsx                              # ヘッダー（ログイン状態、ログアウト）
│   └── ui/                                     # shadcn/ui コンポーネント
│       ├── alert-dialog.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
├── lib/
│   ├── api.ts                # API クライアント
│   └── utils.ts              # ユーティリティ関数
└── README.md
```

## API 仕様

`../constant/api-spec.md` を参照

## 実装済み機能

- ✅ Phase A: ユーザー登録、ログイン、タイトル一覧、出題モード
- ✅ 作成者向け管理機能: タイトル作成・編集・削除、問題作成・編集・削除

## 今後の Phase

- Phase B: お気に入り機能、評価機能、問題メモ機能
