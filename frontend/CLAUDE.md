# CLAUDE.md - Frontend 運用ルール

## 目的とスコープ

Ping-T clone のクイズアプリフロントエンド（Phase A 実装済み）。
タイトル一覧 → 問題セット選択 → 出題モード（1 問ずつ表示・採点）の基本フロー。

## 技術スタック

- Next.js 16 (App Router)
- React 19 + TypeScript 5.9
- Tailwind CSS v4 (グローバル設定は app/globals.css の @theme)
- shadcn/ui (Button/Card/Input/Toast/DropdownMenu)
- Radix UI (shadcn 基盤)

## 環境変数

`.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 認証の扱い

- JWT: `access_token`, `refresh_token`, `username` を localStorage に保存
- API リクエスト時: `Authorization: Bearer {access_token}` を自動付与 (lib/api.ts)
- 401 レスポンス時: localStorage クリア → `/auth/login` へ自動リダイレクト
- ログアウト: localStorage 3 件削除 → `/auth/login` へ遷移
- Header コンポーネント: pathname 変更時に username 再取得、認証ページ (`/auth/*`) では非表示

## API 呼び出しルール

- **api-spec.md が正**: `../constant/api-spec.md` を参照、実装とズレたらまず api-spec を更新
- **API クライアント集約**: `lib/api.ts` に全 API 関数を定義 (login, getTitles, checkAnswer 等)
- **エラーハンドリング**: ApiError クラスで status/message/errors を統一、日本語メッセージを Toast で表示
- **バリデーションエラー**: status=400 かつ field errors あり → `errors: Record<string, string[]>` で保持
- **トークン付与**: apiRequest() が自動で Authorization ヘッダー付与
- **型定義**: Request/Response 型を api.ts に定義 (例: LoginRequest, TitlesResponse)

## 主要ルーティング (Phase A)

| パス                 | 説明                                            |
| -------------------- | ----------------------------------------------- |
| `/`                  | トップ (リダイレクト → `/titles`)               |
| `/titles`            | タイトル一覧 (ページネーション対応)             |
| `/titles/[id]/solve` | 出題モード (クエリ `?random=true` でランダム順) |
| `/auth/login`        | ログイン                                        |
| `/auth/register`     | ユーザー登録                                    |

## 出題モードの状態遷移

1. `getTitleQuestions(titleId, random)` で全問取得
2. `currentIndex` で 1 問ずつ表示
3. 選択肢選択 (`single` → radio、`multiple` → checkbox)
4. 「回答する」 → `checkAnswer(questionId, { selected_choice_ids })` → Toast で結果表示
5. 「次へ」 → currentIndex++、選択リセット、answered=false
6. 最後の問題後 → Toast「完了」 → `/titles` へ遷移

## コーディング規約（最小）

- **コンポーネント分割**: 過度に分割しない、1 ページ 1 コンポーネントで OK
- **shadcn/ui 追加**: 必要最小限のみ `npx shadcn@latest add <component>`
- **フォーム実装**: useState + onChange、複雑でなければ素の state で管理
- **型定義**: 全 API 型は api.ts に集約、コンポーネント内で再定義しない
- **'use client'**: 状態管理・イベントハンドラー・useEffect がある場合のみ明示
- **エラー表示**: Toast (variant="destructive") で統一
- **ローディング**: 基本は `loading` state + 三項演算子で表示切替

## Phase B 以降の予定

- お気に入り機能 (Title への favorite API)
- 評価機能 (Title への rating API)
- 問題メモ機能 (Question へのメモ CRUD)
- タイトル作成・編集 (draft/private/public 切替)
- 問題作成・編集 (単一/複数選択、選択肢管理)
- プロフィール画像対応

## よくある落とし穴

1. **API 仕様のズレ**: フィールド名や型が合わない → api-spec.md を確認、必要なら api-spec を更新
2. **token 期限切れ**: 401 が返ると自動ログアウトされる → リフレッシュトークン実装は Phase B 以降
3. **page/page_size 範囲**: getTitles の page は 1 始まり、page_size は api-spec 参照 (デフォルト 20、max 100)
4. **selected_choice_ids**: 選択肢 ID の配列をそのまま送る、is_correct は送らない (サーバー側で判定)
5. **question_type**: `single` は 1 つのみ選択可、`multiple` は複数選択可 → UI を radio/checkbox で切替
6. **random 順序**: `/titles/[id]/solve?random=true` で API に `?random=true` を渡す
7. **Toast タイミング**: 非同期処理後に表示、成功/エラーで variant を切替
8. **localStorage SSR 問題**: `typeof window !== 'undefined'` でガード (api.ts, Header.tsx で実装済み)
9. **Tailwind v4**: config は空、スタイルは globals.css の @theme で設定
10. **ページネーション計算**: `totalPages = Math.ceil(count / pageSize)`、1-indexed で管理

## 開発コマンド

```bash
npm run dev    # 開発サーバー (http://localhost:3000)
npm run build  # ビルド (型チェック含む)
npm run lint   # ESLint
```

## ディレクトリ構造 (Phase A)

```
app/
├── auth/login/page.tsx       # ログイン
├── auth/register/page.tsx    # 登録
├── titles/page.tsx           # タイトル一覧
├── titles/[id]/solve/page.tsx # 出題モード
├── layout.tsx                # ルートレイアウト (Header, Toaster)
└── page.tsx                  # トップ (リダイレクト)
components/
├── Header.tsx                # ヘッダー (ログイン状態、ログアウト)
└── ui/                       # shadcn/ui (button, card, input, toast, dropdown-menu)
lib/
├── api.ts                    # API クライアント (全 API 関数・型定義)
└── utils.ts                  # cn() など
```

---

**運用方針**: このファイルは最小限の運用ルールのみ記載。API 詳細は `../constant/api-spec.md`、実装詳細はコード参照。
コード解析は調査時には SerenaMCP の解析結果を利用。
