/**
 * 投票結果リアルタイム更新API（Server-Sent Events）
 * GET /api/rooms/[id]/results/events
 *
 * 投票結果と投票状況の変更をリアルタイムでクライアントに配信します。
 * 得票数順での結果、投票進捗、勝者情報を5秒間隔で送信します。
 * 接続エラー時はクライアント側でHTTPポーリングにフォールバックします。
 */
import { query } from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  // SSEレスポンスヘッダーを設定
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  };

  // ReadableStreamを作成
  const stream = new ReadableStream({
    start(controller) {
      // 初回データ送信
      sendResultsUpdate(controller, roomId);

      // 5秒間隔でデータを送信
      const interval = setInterval(async () => {
        try {
          await sendResultsUpdate(controller, roomId);
        } catch (error) {
          console.error('SSE結果送信エラー:', error);
          clearInterval(interval);
          controller.close();
        }
      }, 5000);

      // 接続が閉じられた時のクリーンアップ
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}

async function sendResultsUpdate(
  controller: ReadableStreamDefaultController,
  roomId: string
) {
  try {
    // ルーム情報を取得
    const roomResult = await query(
      'SELECT id, title, created_at, expires_at, status FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      controller.enqueue(
        `event: error\ndata: ${JSON.stringify({
          error: 'ルームが見つかりません',
        })}\n\n`
      );
      return;
    }

    const room = roomResult.rows[0];

    // 投票結果を取得
    const resultsQuery = `
      SELECT 
        p.id,
        p.name,
        COUNT(v.id) as vote_count
      FROM participants p
      LEFT JOIN votes v ON p.id = v.candidate_id
      WHERE p.room_id = $1
      GROUP BY p.id, p.name
      ORDER BY vote_count DESC, p.name ASC
    `;

    const resultsResult = await query(resultsQuery, [roomId]);
    const results = resultsResult.rows.map(row => ({
      ...row,
      vote_count: parseInt(row.vote_count),
    }));

    // 投票状況を取得
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

    // 勝者を決定
    const maxVotes = results.length > 0 ? results[0].vote_count : 0;
    const winners = results.filter(
      result => result.vote_count === maxVotes && maxVotes > 0
    );

    // データを送信
    const data = {
      room: {
        id: room.id,
        title: room.title,
        created_at: room.created_at,
        expires_at: room.expires_at,
        status: room.status,
      },
      results,
      voteStatus: {
        votedCount,
        totalParticipants,
        isComplete: votedCount === totalParticipants && totalParticipants > 0,
      },
      winners,
    };

    controller.enqueue(
      `event: results-update\ndata: ${JSON.stringify(data)}\n\n`
    );
  } catch (error) {
    console.error('結果データ取得エラー:', error);
    controller.enqueue(
      `event: error\ndata: ${JSON.stringify({
        error: 'データの取得に失敗しました',
      })}\n\n`
    );
  }
}
