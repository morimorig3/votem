/**
 * 投票開始API
 * POST /api/rooms/[id]/start-voting
 *
 * ルームステータスを'waiting'から'voting'に変更し、
 * 全参加者に投票開始を通知します。
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { votemEvents } from '@/lib/eventEmitter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  let participantId: string | undefined;

  try {
    const body = await request.json();
    participantId = body.participantId;

    if (!roomId || !participantId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
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

    // ルームステータスチェック
    if (room.status !== 'waiting') {
      return NextResponse.json(
        { error: '投票は既に開始されています' },
        { status: 400 }
      );
    }

    // 投票開始者が参加者として存在するかチェック
    const participantResult = await query(
      'SELECT id FROM participants WHERE id = $1 AND room_id = $2',
      [participantId, roomId]
    );

    if (participantResult.rows.length === 0) {
      return NextResponse.json(
        { error: '投票開始者が参加者として見つかりません' },
        { status: 404 }
      );
    }

    // 参加者数チェック（2人以上必要）
    const participantCountResult = await query(
      'SELECT COUNT(*) as count FROM participants WHERE room_id = $1',
      [roomId]
    );

    const participantCount = parseInt(participantCountResult.rows[0].count);
    if (participantCount < 2) {
      return NextResponse.json(
        { error: '投票には最低2人の参加者が必要です' },
        { status: 400 }
      );
    }

    // ルームステータスを'voting'に変更
    await query('UPDATE rooms SET status = $1 WHERE id = $2', [
      'voting',
      roomId,
    ]);

    // 投票開始イベントを発火
    votemEvents.emitRoomStatusChanged(roomId, 'voting');

    return NextResponse.json({
      success: true,
      message: '投票を開始しました',
      roomStatus: 'voting',
    });
  } catch (error) {
    console.error('投票開始エラー:', error);
    return NextResponse.json(
      { error: '投票開始に失敗しました' },
      { status: 500 }
    );
  }
}
