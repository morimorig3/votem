/**
 * 投票やり直しAPI
 * POST /api/rooms/[id]/restart-voting
 *
 * 全ての投票を削除してルームステータスを'waiting'に戻します。
 * 全ての投票が完了している場合のみ実行可能です。
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

    // 参加者が存在するかチェック
    const participantResult = await query(
      'SELECT id FROM participants WHERE id = $1 AND room_id = $2',
      [participantId, roomId]
    );

    if (participantResult.rows.length === 0) {
      return NextResponse.json(
        { error: '参加者が見つかりません' },
        { status: 404 }
      );
    }

    // 投票状況を確認（全員が投票済みの場合のみ実行可能）
    const voteStatusQuery = `
      SELECT 
        COUNT(DISTINCT v.voter_id) as voted_count,
        COUNT(DISTINCT p.id) as total_participants
      FROM participants p
      LEFT JOIN votes v ON p.id = v.voter_id AND v.room_id = $1
      WHERE p.room_id = $1
    `;

    const voteStatusResult = await query(voteStatusQuery, [roomId]);
    const voteStatus = voteStatusResult.rows[0];
    const votedCount = parseInt(voteStatus.voted_count);
    const totalParticipants = parseInt(voteStatus.total_participants);

    // 全員が投票済みでない場合はエラー
    if (votedCount !== totalParticipants || totalParticipants === 0) {
      return NextResponse.json(
        { error: '全ての参加者が投票を完了していません' },
        { status: 400 }
      );
    }

    // 全ての投票を削除
    await query('DELETE FROM votes WHERE room_id = $1', [roomId]);

    // ルームステータスを'waiting'に戻す
    await query('UPDATE rooms SET status = $1 WHERE id = $2', [
      'waiting',
      roomId,
    ]);

    // 投票やり直しイベントを発火
    votemEvents.emitRoomStatusChanged(roomId, 'waiting');

    return NextResponse.json({
      success: true,
      message: '投票をやり直しました',
      roomStatus: 'waiting',
    });
  } catch (error) {
    console.error('投票やり直しエラー:', error);
    return NextResponse.json(
      { error: '投票やり直しに失敗しました' },
      { status: 500 }
    );
  }
}