# Votem 開発プラン

## プロジェクト概要

VoTemは匿名投票・ランダム選択システムです。投票主催者がルームを作成し、参加者がURLでアクセスして匿名投票を行います。

## 確定仕様

- **参加者 = 投票者 = 候補者**（シンプル設計）
- **自分にも投票可能**
- 1人1票、匿名投票
- ルーム有効期限30分

## 技術スタック

- **フロントエンド**: Next.js + TypeScript + Tailwind CSS + shadcn/ui
- **データベース**: Vercel Postgres
- **デプロイ**: Vercel

## データ構造

### Room

```typescript
{
  id: string (UUID)
  title: string
  createdAt: timestamp
  expiresAt: timestamp (30分後)
  status: 'waiting' | 'voting' | 'completed'
}
```

### Participant

```typescript
{
  id: string;
  roomId: string;
  name: string;
  joinedAt: timestamp;
}
```

### Vote

```typescript
{
  id: string;
  roomId: string;
  participantId: string;
  selectedParticipantId: string;
  createdAt: timestamp;
}
```

## 開発フロー（確認・コミットポイント）

### 0. 初期設定

#### ✅ 開発プラン文書化

- [x] 開発プランを./docs/development-plan.mdに保存 → **確認・コミット**

#### Git初期化

- [ ] `git init`で初期化
- [ ] 既存ファイル（CLAUDE.md、要件定義.md、開発プラン）をコミット → **確認・コミット**

### 1. Next.jsプロジェクトセットアップ

#### Next.js基本セットアップ

- [ ] `npx create-next-app@latest . --typescript --tailwind --eslint --app`実行
- [ ] package.jsonとプロジェクト構造確認
- [ ] 開発サーバー起動確認 → **動作確認・コミット**

#### shadcn/ui セットアップ

- [ ] `npx shadcn@latest init`実行
- [ ] 基本コンポーネント追加（Button、Card、Input等）
- [ ] サンプルページでコンポーネント動作確認 → **動作確認・コミット**

### 2. データベースセットアップ

#### ローカル開発環境（Docker）

- [ ] Docker Compose設定作成（PostgreSQL）
- [ ] 環境変数設定（.env.local）
- [ ] PostgreSQL接続ライブラリ（pg、@types/pg）インストール
- [ ] ローカルDB接続テスト → **動作確認・コミット**

#### 本番環境（Vercel Postgres）

- [ ] Vercelプロジェクト作成
- [ ] Postgres追加設定
- [ ] 本番環境変数設定
- [ ] 本番DB接続テスト → **動作確認・コミット**

#### データベーススキーマ作成

- [ ] Room、Participant、Voteテーブル作成
- [ ] 初期化スクリプト作成（/scripts/init-db.sql）
- [ ] マイグレーション機能実装
- [ ] ローカル・本番両方でテーブル作成確認 → **動作確認・コミット**

### 3. API実装（各項目ごとに確認・コミット）

#### ルーム関連API

- [ ] **ルーム作成API** (`/api/rooms` POST)
  - UUID生成、30分有効期限設定
  - → **動作確認・コミット**
- [ ] **ルーム取得API** (`/api/rooms/[id]` GET)
  - ルーム詳細、参加者一覧取得
  - → **動作確認・コミット**

#### 参加者関連API

- [ ] **参加者参加API** (`/api/rooms/[id]/participants` POST)
  - 名前重複チェック、参加者追加
  - → **動作確認・コミット**

#### 投票関連API

- [ ] **投票API** (`/api/rooms/[id]/vote` POST)
  - 重複投票チェック、投票記録
  - → **動作確認・コミット**
- [ ] **結果取得API** (`/api/rooms/[id]/results` GET)
  - 投票結果集計、勝者決定
  - → **動作確認・コミット**

### 4. フロントエンド実装（各項目ごとに確認・コミット）

#### 基本画面

- [ ] **ホームページ**（`/`）
  - ルーム作成フォーム
  - ルーム参加（URL入力）
  - → **動作確認・コミット**

- [ ] **ルーム管理画面**（`/rooms/[id]/admin`）
  - 参加者一覧表示
  - 投票開始ボタン
  - URL共有機能
  - → **動作確認・コミット**

- [ ] **参加者画面**（`/rooms/[id]`）
  - 名前入力フォーム
  - 投票画面（参加者一覧から選択）
  - → **動作確認・コミット**

- [ ] **結果画面**（`/rooms/[id]/results`）
  - 投票結果表示
  - ランダム選択ボタン
  - → **動作確認・コミット**

### 5. 追加機能（各項目ごとに確認・コミット）

#### 機能拡張

- [ ] **URL有効期限管理**
  - 30分経過後の自動無効化
  - 期限切れページ表示
  - → **動作確認・コミット**

- [ ] **リアルタイム更新**
  - 参加者追加時の画面自動更新
  - 投票状況のリアルタイム表示
  - → **動作確認・コミット**

- [ ] **エラーハンドリング**
  - API エラー処理
  - ユーザーフレンドリーなエラーメッセージ
  - → **動作確認・コミット**

- [ ] **レスポンシブ対応**
  - モバイル画面対応
  - タブレット画面対応
  - → **動作確認・コミット**

## 各段階のチェックポイント

### 動作確認項目

1. **セットアップ確認**: 開発サーバーが正常に起動するか
2. **データベース確認**: 接続とテーブル作成が正常に完了するか
3. **API確認**: Postman等でAPIが正常に動作するか
4. **UI確認**: 画面表示と操作が正常に動作するか
5. **統合確認**: フロントエンドとAPIの連携が正常に動作するか

### コミットタイミング

- 各実装項目完了時
- 動作確認完了時
- 修正対応完了時

## 注意事項

- 各段階で必ず動作確認を行う
- 問題があれば修正してから次の段階に進む
- コミットはユーザーが行う
- 実装中に仕様変更があれば文書を更新する
