# HANDOFF.md — DriveGuard Mobile

## 現在の状態
v0.1.0 リリース完了。Render デプロイ設定済み。

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

## Render デプロイ手順
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
