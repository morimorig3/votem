-- VoTem Database Schema
-- 投票アプリケーションのためのデータベーススキーマ

-- Roomテーブル: 投票ルーム
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'voting', 'completed'))
);

-- Participantテーブル: 参加者（投票者兼候補者）
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, name) -- 同じルーム内で同じ名前は不可
);

-- Voteテーブル: 投票記録
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, voter_id) -- 1人1票制限
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_votes_room_id ON votes(room_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);

-- サンプルデータ（開発用）
-- 30分後に期限切れのテストルーム
INSERT INTO rooms (title, expires_at) 
VALUES ('テスト投票', CURRENT_TIMESTAMP + INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;