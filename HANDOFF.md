# HANDOFF.md — DriveGuard Mobile

## 現在の状態
v0.1.0 リリース済み。ローカルDocker動作確認済み。`rikb.telejapan.net` 公開作業中（Cloudflare Tunnel設定中）。

## 最終作業 (2026-06-27)
- v0.1.0 タグ付けリリース
- Render デプロイ設定（render.yaml）追加
- DATABASE_URL 対応（Render Postgres 互換）
- 起動時自動マイグレーション・シード追加
- ログイン画面クイックログインボタン追加
- ソースボリュームマウントで HMR 有効化
- tsc hook をローカル node_modules がない場合スキップするよう修正

## アクセス情報（ローカル）
| 項目 | 値 |
|---|---|
| フロントエンド | http://localhost:5174 |
| バックエンドAPI | http://localhost:3002 |
| 管理者アカウント | manager@example.com / password123 |
| 運転者アカウント | driver1@example.com / password123 |

## rikb.telejapan.net 公開（進行中）
- VPS: 49.212.205.85（ai.telejapan.net が向いているサーバー）
- 方針: Docker Composeをそのままgit cloneしてVPSで起動
- 状態: SSH接続情報待ち（ユーザー名・SSHキーが必要）
- muumuu MCP（Claude Desktop）でAレコード追加が必要
  `rikb.telejapan.net A 49.212.205.85`

## Render デプロイ手順（参考）
1. https://render.com でログイン
2. New → Blueprint → GitHub リポジトリ `tao-munakata/driveguard` を選択
3. render.yaml が自動検出され 3 サービス（DB・backend・frontend）が作成される
4. デプロイ完了後、frontend の VITE_API_URL を実際の backend URL に更新

## 起動方法（ローカル）
```bash
cd /Users/tao/ai/driveguard
docker compose up -d
```

## 実装済み機能
- JWT認証 + RBAC（driver / manager）
- アルコールチェック記録（乗車前/後、閾値0.15mg/L自動判定）
- 運転日報作成（3ステップ：基本情報→走行記録→給油情報）
- 記録一覧・フィルタ・詳細表示
- 管理者ダッシュボード（承認/差し戻しワークフロー）

## 既知の制限
- ローカルポートは 3002/5174（本来は 3001/5173、ホスト競合のため変更）
- Phase 2: Bluetooth連携・GPS・電子署名・CSVは未実装

## リポジトリ
https://github.com/tao-munakata/driveguard

## 2026-06-27 セッション記録（v0.1.0 → v0.1.1）

### v0.1.0
- 初期実装・Docker動作確認・GitHub push
- Hono + D1 Cloudflare Workers バックエンド構築（driveguard-api.affihub-tao.workers.dev）
- フロントエンドCF Workerデプロイ（黒画面問題あり・保留）

### v0.1.1
- VPS（49.212.205.85）に Docker Compose でデプロイ完了
  - SSH key: ~/.ssh/id_ed25519_vps_telejapan / user: ubuntu
  - /home/ubuntu/driveguard/ に git clone
  - backend:3006, frontend(Vite):5175, db:internal
- フロントエンドを静的ビルドして nginx から直接配信
  - VITE_API_URL=http://rikb.telejapan.net/api でビルド
  - /home/ubuntu/driveguard/frontend/dist → nginx /var/www/driveguard
- nginx（/home/ubuntu/nginx/）に rikb.telejapan.net ブロック追加
  - /api/* → backend:3006 にプロキシ
  - それ以外 → 静的ファイル (try_files)
- Stop hook permission_mode を bypassPermissions に修正
- Vite allowedHosts: 'all' 追加（vite.config.ts）
- 残タスク: muumuu MCP で rikb.telejapan.net A 49.212.205.85 を追加 → HTTPS化（certbot）

## 2026-06-27 セッション記録（v0.1.0リリース完了）
- v0.1.0 を GitHub にpush（GitHub Actions CI パス）
- Render デプロイ設定（`render.yaml`）及びマイグレーション・シード設定完了
- 次: Render にログイン → Blueprint で GitHub リポジトリ接続 → 自動デプロイ
- 注意: デプロイ完了後、backend の実際URL を frontend の VITE_API_URL に設定し Redeploy 必要

## 2026-06-27 セッション記録（Renderデプロイ手順説明）
- Renderダッシュボードの Blueprint フロー操作手順を説明
- render.yaml は GitHub リポジトリに存在（確認済み）
- 次: Render.com でダッシュボード右上 [New +] → [Blueprint] → GitHub接続 → Apply で自動デプロイ開始
- 残タスク: Render Blueprint フローの実行・デプロイ確認、VITE_API_URL の更新設定

## 2026-06-27 セッション記録（Railway + Cloudflare Pages デプロイ設定）
- Railway・Cloudflare Pages デプロイ設定・railway.toml 追加（バックエンド自動検出）
- GitHub にpush完了
- 2段階デプロイ手順を提供：Step1（Railway: バックエンド + PostgreSQL）→ Step2（Cloudflare Pages: フロントエンド）
- 残タスク: Railway デプロイ実施 → URLコピー → Cloudflare Pages の VITE_API_URL に設定・デプロイ

## 2026-06-27 セッション記録（Cloudflare Pages フロントデプロイ完了）
- フロントエンドを Cloudflare Pages に デプロイ完了（URL: `https://driveguard.affihub-tao.workers.dev`）
- 現状: バックエンド（API）がまだデプロイされていないため、ログイン機能が動作しない状態
- Railway でのバックエンド + PostgreSQL デプロイが次のステップ
- 残タスク: Railway でバックエンドデプロイ → API URL を取得 → VITE_API_URL を更新して Cloudflare に再デプロイ

## 2026-06-27 セッション記録（Railway デプロイ手順説明）
- Railway.app でのバックエンド + PostgreSQL デプロイ手順を詳細説明
- 手順: ログイン → New Project → Deploy from GitHub → PostgreSQL 追加 → 環境変数設定 → Domain 生成
- セッション終了時点で Railway URL の確認待ち状態
- 残タスク: Railway デプロイ実行 → バックエンド URL を取得 → Cloudflare Pages で VITE_API_URL 更新・再デプロイ

## 2026-06-27 セッション記録（Cloudflare Workers + D1 デプロイ完了）
- バックエンドを Hono + Cloudflare Workers + D1 に マイグレーション完了
- フロントエンド・バックエンド両方を Cloudflare でホスティング（無料・永続）
- デプロイURL: フロントエンド `https://driveguard.affihub-tao.workers.dev` / API `https://driveguard-api.affihub-tao.workers.dev`
- テストアカウント動作確認済み（manager@example.com / driver1@example.com）
- 残タスク: なし（デプロイ完了・公開済み）

## 2026-06-27 セッション記録（ローカル環境動作確認・Cloudflare保留）
- ローカル環境の動作確認完了（フロントエンド: http://localhost:5174、バックエンド: http://localhost:3002）
- Cloudflare Workers への本格移植は一旦保留（公開が必要になったときに対応）
- ローカルでの開発・テストは正常に動作中
- 残タスク: なし（ローカルは正常稼働）

## 2026-06-28 セッション記録（DNS・カスタムドメイン調査）
- ai.telejapan.net の DNS 設定を調査：muumuu で管理（Cloudflare ではなく）、`49.212.205.85`（VPS A レコード）に指向
- Cloudflare Workers 黒画面の原因を特定：ビルド済みファイルが反映されていない問題
- muumuu MCP は Claude Desktop 側のため、このセッションからは操作不可
- 残タスク: Cloudflare黒画面を修正＆デプロイ → muumuu MCP で CNAME レコード追加（Claude Desktop側で実施）

## 2026-06-28 セッション記録（VPS デプロイ環境構築完了）
- VPS (49.212.205.85) での環境構築完了：Node.js LTS・Docker Compose インストール済み
- リポジトリ git clone 実施
- Docker Compose で driveguard 起動確認（全コンテナ正常稼働）
- 残タスク: DNS A レコード追加（rikb.telejapan.net → 49.212.205.85）をmuumuu MCP で設定 → HTTPS化（Let's Encrypt）
