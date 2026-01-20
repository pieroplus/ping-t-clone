# ディレクトリ構造

```
frontend/
├── app/                    # Next.js App Router ページ
│   ├── auth/              # 認証関連ページ
│   │   ├── login/
│   │   │   └── page.tsx   # ログイン画面
│   │   └── register/
│   │       └── page.tsx   # 登録画面
│   ├── titles/            # タイトル関連ページ
│   │   ├── page.tsx       # タイトル一覧
│   │   └── [id]/solve/
│   │       └── page.tsx   # 出題モード
│   ├── layout.tsx         # ルートレイアウト（ヘッダー、Toasterを含む）
│   ├── page.tsx           # トップページ（/titles へリダイレクト）
│   └── globals.css        # グローバルスタイル（Tailwind v4 @theme）
│
├── components/            # Reactコンポーネント
│   ├── Header.tsx         # ヘッダー（ログイン状態、ログアウト）
│   └── ui/                # shadcn/ui コンポーネント
│       ├── button.tsx
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
│
├── lib/                   # ユーティリティとヘルパー
│   ├── api.ts             # API クライアント、型定義
│   └── utils.ts           # ユーティリティ関数（cn など）
│
├── .next/                 # Next.js ビルド出力（Git管理外）
├── node_modules/          # npm パッケージ（Git管理外）
├── .serena/               # Serenaメモリディレクトリ
├── .claude/               # Claude設定ディレクトリ
│
├── .env.local             # 環境変数（Git管理外）
├── .env.example           # 環境変数サンプル
├── .gitignore             # Git除外設定
├── components.json        # shadcn/ui 設定
├── next.config.ts         # Next.js 設定
├── next-env.d.ts          # Next.js TypeScript定義
├── package.json           # npm 依存関係とスクリプト
├── package-lock.json      # npm ロックファイル
├── postcss.config.mjs     # PostCSS 設定
├── README.md              # プロジェクト README
├── tailwind.config.ts     # Tailwind CSS 設定（v4では空）
└── tsconfig.json          # TypeScript 設定
```

## 主要ディレクトリの説明

### `app/`
Next.js App Routerのページとレイアウト。
- ファイルベースルーティング
- `page.tsx` でページを定義
- `layout.tsx` で共通レイアウトを定義
- `[id]` で動的ルーティング

### `components/`
再利用可能なReactコンポーネント。
- `ui/`: shadcn/uiコンポーネント
- トップレベル: カスタムコンポーネント（`Header.tsx`など）

### `lib/`
ユーティリティ関数とヘルパー。
- `api.ts`: バックエンドAPI通信
- `utils.ts`: 汎用ユーティリティ

## ファイル命名規則
- Reactコンポーネント: PascalCase (`Header.tsx`, `LoginPage.tsx`)
- ユーティリティ: camelCase (`api.ts`, `utils.ts`)
- Next.jsページ: `page.tsx` (固定)
- Next.jsレイアウト: `layout.tsx` (固定)
