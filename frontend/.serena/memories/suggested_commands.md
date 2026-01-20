# 推奨コマンド

## npm スクリプト

### 開発
```bash
npm run dev
```
開発サーバーを起動。デフォルトで http://localhost:3000 でアクセス可能。
ホットリロード有効。

### ビルド
```bash
npm run build
```
本番環境用にアプリケーションをビルド。

### 本番起動
```bash
npm start
```
ビルド済みアプリケーションを本番モードで起動。
事前に `npm run build` を実行する必要がある。

### リント
```bash
npm run lint
```
Next.js ESLintでコードをチェック。

### パッケージ管理
```bash
npm install
```
package.jsonに記載された依存パッケージをインストール。

```bash
npm install <package-name>
```
新しいパッケージを追加。

```bash
npm install --save-dev <package-name>
```
開発依存パッケージを追加。

## Git コマンド

### 基本操作
```bash
git status
git add .
git commit -m "commit message"
git push
git pull
```

## システムコマンド (Darwin/macOS)

### ファイル操作
```bash
ls          # ファイル一覧
ls -la      # 隠しファイルを含む詳細一覧
cd <dir>    # ディレクトリ移動
pwd         # 現在のディレクトリパス表示
```

### 検索
```bash
find . -name "*.tsx"     # ファイル検索
grep -r "search" .       # テキスト検索
```

### プロセス管理
```bash
lsof -i :3000           # ポート3000を使用しているプロセスを確認
kill -9 <PID>           # プロセスを強制終了
```

## 環境変数設定

`.env.local` ファイルを作成（`.env.example` を参照）:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## よく使うワークフロー

### 初回セットアップ
```bash
npm install
# .env.localを作成して環境変数を設定
npm run dev
```

### コード変更後
```bash
npm run lint    # リントチェック
npm run build   # ビルドエラーがないか確認
```
