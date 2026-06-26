# HANDOFF.md — DriveGuard Mobile

## 現在の状態
MVP 初期実装完了・Docker環境でローカル動作確認済み。

## 最終作業 (2026-06-27)
- Docker Compose 3コンテナ構成（db/backend/frontend）を構築
- 全画面 (SC-01〜SC-07) を実装
- GitHub push 完了: https://github.com/tao-munakata/driveguard

## アクセス情報
| 項目 | 値 |
|---|---|
| フロントエンド | http://localhost:5174 |
| バックエンドAPI | http://localhost:3002 |
| 管理者アカウント | manager@example.com / password123 |
| 運転者アカウント | driver1@example.com / password123 |

## 起動方法
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

## 既知の制限・TODO
- ポートが3002/5174（本来は3001/5173、ホスト競合のため変更）
- docker-compose.yml に obsolete `version` 属性の警告あり（無害）
- Phase 2: Bluetooth連携、GPS、電子署名、CSVエクスポートは未実装

## 次のステップ候補
1. ブラウザ実機動作確認・UX改善
2. ポート競合解消（3001/5173に戻すかenv変数化）
3. バグ修正対応
