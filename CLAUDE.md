# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

VoTemは匿名投票・ランダム選択システムです。投票主催者がルームを作成し、参加者がURLでアクセスして匿名投票を行います。

## 技術スタック

- **フロントエンド**: Next.js + TypeScript + Tailwind CSS
- **データベース**: Vercel Postgres
- **デプロイ**: Vercel

## プロジェクトアーキテクチャ

現在プロジェクトは要件定義段階で、実装はまだ開始されていません。

### データ構造

#### Room
```typescript
{
  id: string (UUID)
  title: string
  createdAt: timestamp
  expiresAt: timestamp (30分後)
  status: 'waiting' | 'voting' | 'completed'
}
```

#### Participant
```typescript
{
  id: string
  roomId: string
  name: string
  joinedAt: timestamp
}
```

#### Vote
```typescript
{
  id: string
  roomId: string
  participantId: string
  selectedParticipantId: string
  createdAt: timestamp
}
```

## 主要機能

- **ルーム機能**: 投票主催者がルームを作成、一意のURL生成、30分の有効期限
- **投票機能**: 単一選択による匿名投票、リアルタイム結果表示
- **参加者管理**: URLアクセスによる参加、名前入力による識別

## 開発コマンド

プロジェクトがまだ初期化されていないため、以下のコマンドで開始：

```bash
# Next.jsプロジェクトの初期化
npx create-next-app@latest . --typescript --tailwind --eslint --app

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# リント
npm run lint
```