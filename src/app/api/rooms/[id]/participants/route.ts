/**
 * 参加者追加API
 * POST /api/rooms/[id]/participants
 *
 * ルームに新しい参加者を追加します。
 * 参加者は投票者かつ候補者として機能します。
 * 同じ名前の重複登録は防止されます。
 */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/database';
import { Participant } from '@/types/database';
import { votemEvents } from '@/lib/eventEmitter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const { name } = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { error: 'ルームIDが必要です' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '名前は必須です' }, { status: 400 });
    }

    // ルーム存在チェックと期限チェック
    const roomResult = await query('SELECT * FROM rooms WHERE id = $1', [
      roomId,
    ]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'ルームが見つかりません' },
        { status: 404 }
      );
    }

    const room = roomResult.rows[0];
    if (new Date() > new Date(room.expires_at)) {
      return NextResponse.json(
        { error: 'ルームの有効期限が切れています' },
        { status: 410 }
      );
    }

    // 投票中または完了状態では参加不可
    if (room.status !== 'waiting') {
      return NextResponse.json(
        { error: 'このルームは既に投票が開始されているため参加できません' },
        { status: 400 }
      );
    }

    // 同じ名前の参加者が既に存在するかチェック
    const existingParticipant = await query(
      'SELECT id FROM participants WHERE room_id = $1 AND name = $2',
      [roomId, name.trim()]
    );

    if (existingParticipant.rows.length > 0) {
      return NextResponse.json(
        { error: 'この名前は既に使用されています' },
        { status: 409 }
      );
    }

    // 参加者を追加
    const participantId = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO participants (id, room_id, name, joined_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [participantId, roomId, name.trim(), now]
    );

    const participant: Participant = result.rows[0];

    // 参加者追加イベントを発火
    votemEvents.emitParticipantJoined(roomId, {
      participant,
      room: { id: roomId, status: room.status },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error('参加者追加エラー:', error);
    return NextResponse.json(
      { error: '参加者の追加に失敗しました' },
      { status: 500 }
    );
  }
}
