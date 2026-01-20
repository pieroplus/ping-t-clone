# コードスタイルと規約

## TypeScript

### 命名規則
- **コンポーネント**: PascalCase (`Header`, `LoginPage`)
- **インターフェース/型**: PascalCase (`LoginRequest`, `User`, `Title`)
- **関数**: camelCase (`apiRequest`, `handleLogout`, `getTitles`)
- **変数**: camelCase (`username`, `currentUser`)
- **定数**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### 型定義
- すべての関数とコンポーネントに型を明示
- APIレスポンスとリクエストにはインターフェースを定義
- 厳格モード (strict: true) を使用
- 型推論を活用しつつ、明示的な型注釈を優先

### インポート
- パスエイリアス `@/` を使用してインポート簡潔化
- Reactの機能は名前付きインポート: `import { useState } from 'react'`
- Next.jsの機能も名前付きインポート: `import { useRouter } from 'next/navigation'`
- コンポーネントはデフォルトインポート: `import Header from '@/components/Header'`

## React/Next.js

### コンポーネント
- 関数コンポーネントを使用（クラスコンポーネントは使用しない）
- デフォルトエクスポートでページコンポーネントをエクスポート
- 名前付きエクスポートでユーティリティ関数や型をエクスポート

### クライアント/サーバーコンポーネント
- クライアント側の状態やイベントハンドラーが必要な場合は `'use client'` を先頭に記述
- それ以外はサーバーコンポーネント（デフォルト）

### Hooks
- React Hooksパターンを使用
- カスタムHooksは `use` プレフィックス
- 一般的なHooks: `useState`, `useEffect`, `useRouter`, `usePathname`

### エラーハンドリング
- カスタム `ApiError` クラスでAPIエラーを管理
- try-catch でエラーをキャッチ
- ユーザーにはToastで通知

## スタイリング

### Tailwind CSS
- Tailwind CSS v4を使用
- グローバルスタイルは `app/globals.css` で @theme ディレクティブを使用
- インラインクラス名で直接スタイリング
- `className` 属性を使用

### UIコンポーネント
- shadcn/uiコンポーネントは `@/components/ui/` から使用
- カスタムコンポーネントは `@/components/` に配置

## ファイル構造
- ページ: `app/` ディレクトリ内、Next.js App Router規約に従う
- コンポーネント: `components/` ディレクトリ
- ユーティリティ: `lib/` ディレクトリ
- UIコンポーネント: `components/ui/` ディレクトリ

## コード品質
- ESLintによるリント (Next.jsデフォルト設定)
- TypeScript厳格モード有効
- 未使用の変数やインポートを避ける
