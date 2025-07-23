# 投票アプリ

URLを共有するだけで簡単に匿名投票ができるWebアプリケーションです。

## 使い方

1. **ルーム作成**: 投票テーマを設定してルームを作成
2. **URL共有**: 生成されたURLを参加者に共有
3. **参加者登録**: 各参加者が名前を入力して参加
4. **投票開始**: 投票を開始
5. **匿名投票**: 参加者が他の参加者に投票
6. **結果確認**: 棒グラフで結果を表示

## 技術スタック

- **フロントエンド**: Next.js 15 + TypeScript + Chakra UI v3
- **グラフ表示**: Chart.js + react-chartjs-2
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **デプロイ**: Vercel
- **その他**: Framer Motion, Prettier, ESLint

## プロジェクト構造

```
src/
├── app/                          # Next.js App Router
│   ├── create/                   # ルーム作成ページ
│   ├── rooms/[id]/               # ルーム関連ページ
│   │   ├── page.tsx              # ルーム待機画面
│   │   ├── vote/page.tsx         # 投票画面
│   │   └── results/page.tsx      # 結果画面
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # ホーム画面
│   └── providers.tsx             # Chakra UI Provider
├── components/                   # React コンポーネント
│   ├── AppHeader.tsx             # 投票アイコン付きヘッダー
│   ├── PageLayout.tsx            # 共通レイアウト
│   ├── room/                     # ルーム画面コンポーネント
│   │   ├── MainRoomScreen.tsx    # メインルーム画面
│   │   ├── JoinRoomForm.tsx      # 参加フォーム
│   │   ├── ParticipantsList.tsx  # 参加者リスト
│   │   └── VotingActions.tsx     # 投票開始ボタン
│   ├── vote/                     # 投票画面コンポーネント
│   │   ├── MainVoteScreen.tsx    # メイン投票画面
│   │   ├── ParticipantSelector.tsx # 参加者選択
│   │   └── VoteActions.tsx       # 投票ボタン
│   └── results/                  # 結果画面コンポーネント
│       ├── MainResultsScreen.tsx # メイン結果画面
│       ├── VoteChart.tsx         # Chart.js棒グラフ
│       ├── VoteResultsList.tsx   # 結果リスト（Chart.jsのみ）
│       ├── VoteStatusCard.tsx    # 投票状況（シンプルテキスト）
│       └── ResultsActions.tsx    # 再投票ボタン
├── hooks/                        # カスタムフック
│   ├── useError.ts               # エラーハンドリング
│   ├── useSession.ts             # セッション管理
│   └── useTimeRemaining.ts       # 残り時間計算
├── service/                      # API呼び出しサービス
│   ├── roomService.ts            # ルーム関連API
│   ├── participantService.ts     # 参加者関連API
│   └── voteService.ts            # 投票関連API
├── lib/                          # ユーティリティ
│   └── database.ts               # Supabase接続
└── types/                        # TypeScript型定義
    └── database.ts               # データベース型定義
```

## データベーススキーマ

### rooms

- `id`: UUID (Primary Key)
- `title`: string - 投票ルームのタイトル
- `created_at`: timestamp - ルーム作成日時
- `expires_at`: timestamp - 有効期限（作成から30分後）
- `status`: enum - ルーム状態（'waiting' | 'voting' | 'completed'）

### participants

- `id`: UUID (Primary Key)
- `room_id`: UUID (Foreign Key) - 所属ルーム
- `name`: string - 参加者名
- `joined_at`: timestamp - 参加日時

### votes

- `id`: UUID (Primary Key)
- `room_id`: UUID (Foreign Key) - 投票対象ルーム
- `voter_id`: UUID (Foreign Key) - 投票者
- `candidate_id`: UUID (Foreign Key) - 被投票者
- `created_at`: timestamp - 投票日時

## 主要機能の実装詳細

### Chart.js棒グラフ

- `src/components/results/VoteChart.tsx`でChart.jsを使用
- 得票数降順で表示、当選者は金色でハイライト
- 人数が少ない時でも適切な棒の太さに自動調整
- ホバーで詳細情報（得票数・得票率）を表示

### 投票状況表示

- リアルタイムで投票完了状況を監視
- 「残りX人の投票待ち」として簡潔に表示
- 全員投票完了時は「✅ 全員の投票が完了しました」

### 投票アイコンヘッダー

- SVGアイコンでアプリのテーマを視覚化
- 48x48pxサイズで適切な視認性を確保

## デプロイ

このアプリケーションはVercelでホストされており、Supabaseをデータベースとして使用しています。

## ライセンス

MIT License
