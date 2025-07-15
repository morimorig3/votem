import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { votemEvents } from '@/lib/eventEmitter';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roomId } = await params;

    // リクエストボディから参加者IDを取得
    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: '参加者IDが必要です' },
        { status: 400 }
      );
    }

    // ルームの存在確認
    const roomResult = await query(
      'SELECT * FROM rooms WHERE id = $1 AND expires_at > NOW()',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'ルームが見つからないか、有効期限切れです' },
        { status: 404 }
      );
    }

    // 参加者の存在確認
    const participantResult = await query(
      'SELECT * FROM participants WHERE id = $1 AND room_id = $2',
      [participantId, roomId]
    );

    if (participantResult.rows.length === 0) {
      return NextResponse.json(
        { error: '参加者が見つかりません' },
        { status: 404 }
      );
    }

    // 投票を削除してルームステータスを'waiting'に戻す
    await query('DELETE FROM votes WHERE room_id = $1', [roomId]);
    await query('UPDATE rooms SET status = $1 WHERE id = $2', ['waiting', roomId]);

    // イベントを発行
    votemEvents.emitRoomStatusChanged(roomId, 'waiting');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('投票キャンセルエラー:', error);
    return NextResponse.json(
      { error: '投票キャンセルに失敗しました' },
      { status: 500 }
    );
  }
}