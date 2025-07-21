# 投票アプリ

チームの決定を簡単に。匿名投票でスムーズな意思決定を支援するWebアプリケーションです。

## 機能

- **投票ルーム作成**: チームリーダーが投票ルームを作成
- **匿名投票**: 参加者が匿名で投票を実施
- **リアルタイム更新**: 投票状況と結果をリアルタイムで表示
- **投票やり直し**: 全員投票完了後に投票を再実行可能
- **参加者追加**: 投票中でも新しい参加者を追加可能

## 技術スタック

- **フロントエンド**: Next.js 15 + TypeScript + Chakra UI v3
- **バックエンド**: Next.js API Routes
- **データベース**: Neon PostgreSQL
- **リアルタイム通信**: Server-Sent Events (SSE)

## 始め方

### 前提条件

- Docker Desktop
- Node.js 18以上
- PostgreSQL

### 開発環境セットアップ

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd votem
   ```

2. **Docker起動**

   ```bash
   docker-compose up -d
   ```

3. **依存関係のインストール**

   ```bash
   npm install
   ```

4. **環境変数の設定**

   ```bash
   cp .env.local
   ```

   `.env.local`を編集して以下を設定：

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/votem
   ```

5. **データベース初期化**

   ```bash
   npm run db:init
   ```

6. **開発サーバー起動**

   ```bash
   npm run dev
   ```

7. **ブラウザでアクセス**

   [http://localhost:3000](http://localhost:3000) を開く

### 使用可能なコマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# リント
npm run lint

# データベースクリーンアップ
npm run db:clean

# 型チェック
npm run type-check
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── rooms/         # ルーム関連API
│   ├── create/            # ルーム作成ページ
│   └── rooms/[id]/        # ルーム関連ページ
├── components/            # React コンポーネント
│   ├── room/              # ルーム画面用
│   ├── vote/              # 投票画面用
│   └── results/           # 結果画面用
├── lib/                   # ユーティリティ
│   ├── database.ts        # DB接続
│   ├── vercelSSE.ts       # SSE管理
│   └── vercelEvents.ts    # イベント管理
├── hooks/                 # カスタムフック
├── service/               # API呼び出し
└── types/                 # TypeScript型定義
```

## データベーススキーマ

### rooms

- `id`: UUID (Primary Key)
- `title`: 投票タイトル
- `created_at`: 作成日時
- `expires_at`: 有効期限 (作成から30分後)
- `status`: ステータス ('waiting' | 'voting' | 'completed')

### participants

- `id`: UUID (Primary Key)
- `room_id`: ルームID (Foreign Key)
- `name`: 参加者名
- `joined_at`: 参加日時

### votes

- `id`: UUID (Primary Key)
- `room_id`: ルームID (Foreign Key)
- `voter_id`: 投票者ID (Foreign Key)
- `candidate_id`: 候補者ID (Foreign Key)
- `created_at`: 投票日時

## ライセンス

MIT License
