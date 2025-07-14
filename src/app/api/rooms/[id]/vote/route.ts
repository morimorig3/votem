/**
 * 投票実行API
 * POST /api/rooms/[id]/vote
 *
 * 参加者が他の参加者（自分含む）に投票します。
 * 1人1票制限があり、重複投票は防止されます。
 * 初回投票時にルームステータスが'voting'に変更されます。
 */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const roomId = params.id;
  let participantId: string | undefined;
  let selectedParticipantId: string | undefined;

  try {
    const body = await request.json();
    participantId = body.participantId;
    selectedParticipantId = body.selectedParticipantId;

    if (!roomId || !participantId || !selectedParticipantId) {
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

    // ルームが完了状態の場合は投票不可
    if (room.status === 'completed') {
      return NextResponse.json(
        { error: '投票は既に完了しています' },
        { status: 400 }
      );
    }

    // 投票者が存在するかチェック
    const voterResult = await query(
      'SELECT id FROM participants WHERE id = $1 AND room_id = $2',
      [participantId, roomId]
    );

    if (voterResult.rows.length === 0) {
      return NextResponse.json(
        { error: '投票者が見つかりません' },
        { status: 404 }
      );
    }

    // 投票対象者が存在するかチェック
    const candidateResult = await query(
      'SELECT id FROM participants WHERE id = $1 AND room_id = $2',
      [selectedParticipantId, roomId]
    );

    if (candidateResult.rows.length === 0) {
      return NextResponse.json(
        { error: '投票対象者が見つかりません' },
        { status: 404 }
      );
    }

    // 既に投票済みかチェック
    const existingVote = await query(
      'SELECT id FROM votes WHERE room_id = $1 AND voter_id = $2',
      [roomId, participantId]
    );

    if (existingVote.rows.length > 0) {
      return NextResponse.json({ error: '既に投票済みです' }, { status: 409 });
    }

    // 投票を記録
    const voteId = uuidv4();
    const now = new Date();

    await query(
      `INSERT INTO votes (id, room_id, voter_id, candidate_id, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [voteId, roomId, participantId, selectedParticipantId, now]
    );

    // ルームステータスを投票中に更新（初回投票時）
    if (room.status === 'waiting') {
      await query('UPDATE rooms SET status = $1 WHERE id = $2', [
        'voting',
        roomId,
      ]);
    }

    return NextResponse.json({
      success: true,
      message: '投票が完了しました',
    });
  } catch (error) {
    console.error('投票エラー:', error);
    return NextResponse.json({ error: '投票に失敗しました' }, { status: 500 });
  }
}
