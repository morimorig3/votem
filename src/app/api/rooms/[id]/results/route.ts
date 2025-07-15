/**
 * 投票結果取得API
 * GET /api/rooms/[id]/results
 *
 * 投票結果を得票数順で取得します。
 * 投票状況（何人中何人が投票済み）も含まれます。
 * 全員投票完了時にルームステータスが'completed'に変更されます。
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json(
        { error: 'ルームIDが必要です' },
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

    // 投票が開始されていない場合
    if (room.status === 'waiting') {
      return NextResponse.json(
        { error: '投票がまだ開始されていません' },
        { status: 400 }
      );
    }

    // 投票結果取得（得票数順）
    const resultsQuery = `
      SELECT 
        p.id,
        p.name,
        COUNT(v.candidate_id) as vote_count
      FROM participants p
      LEFT JOIN votes v ON p.id = v.candidate_id AND v.room_id = $1
      WHERE p.room_id = $1
      GROUP BY p.id, p.name
      ORDER BY vote_count DESC, p.name ASC
    `;

    const resultsResult = await query(resultsQuery, [roomId]);
    const results = resultsResult.rows.map(row => ({
      ...row,
      vote_count: parseInt(row.vote_count),
    }));

    // 投票状況取得
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

    // 全員投票完了の場合、ルームステータスを完了に更新
    const votedCount = parseInt(voteStatus.voted_count);
    const totalParticipants = parseInt(voteStatus.total_participants);

    if (
      votedCount === totalParticipants &&
      totalParticipants > 0 &&
      room.status === 'voting'
    ) {
      await query('UPDATE rooms SET status = $1 WHERE id = $2', [
        'completed',
        roomId,
      ]);
    }

    // 最高得票者（複数の場合あり）
    const maxVotes = results.length > 0 ? results[0].vote_count : 0;
    const winners = results.filter(r => r.vote_count === maxVotes);

    return NextResponse.json({
      room: {
        ...room,
        status:
          votedCount === totalParticipants && totalParticipants > 0
            ? 'completed'
            : room.status,
      },
      results,
      voteStatus: {
        votedCount,
        totalParticipants,
        isComplete: votedCount === totalParticipants && totalParticipants > 0,
      },
      winners,
    });
  } catch (error) {
    console.error('結果取得エラー:', error);
    return NextResponse.json(
      { error: '結果の取得に失敗しました' },
      { status: 500 }
    );
  }
}
