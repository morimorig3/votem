/**
 * ルームリアルタイム更新API（Server-Sent Events）
 * GET /api/rooms/[id]/events
 *
 * ルーム情報と参加者リストの変更をイベント駆動でリアルタイム配信します。
 * データ変更時のみ通信が発生し、効率的なリアルタイム更新を提供します。
 * 接続エラー時はクライアント側でHTTPポーリングにフォールバックします。
 */
import { sseManager, generateConnectionId } from '@/lib/sseManager';
import { query } from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  // 接続IDを生成
  const connectionId = generateConnectionId();

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
      // SSE接続を登録
      sseManager.addConnection(connectionId, controller, roomId, 'room');

      // 初回データ送信（即座に現在のデータを送信）
      sendInitialRoomData(controller, roomId).catch(error => {
        console.error('初回データ送信エラー:', error);
        try {
          controller.enqueue(
            `event: error\ndata: ${JSON.stringify({
              error: '初期データの取得に失敗しました',
            })}\n\n`
          );
        } catch (e) {
          console.error('エラー送信失敗:', e);
        }
      });

      // 期限切れチェック用のタイマー（1分間隔）
      const expireCheckInterval = setInterval(async () => {
        try {
          await checkRoomExpiration(roomId);
        } catch (error) {
          console.error('期限切れチェックエラー:', error);
        }
      }, 60000);

      // 接続が閉じられた時のクリーンアップ
      request.signal.addEventListener('abort', () => {
        clearInterval(expireCheckInterval);
        sseManager.removeConnection(connectionId);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}

/**
 * 初回接続時にルームデータを送信
 * @param controller - ReadableStreamController
 * @param roomId - ルームID
 */
async function sendInitialRoomData(
  controller: ReadableStreamDefaultController,
  roomId: string
) {
  try {
    console.log(`SSE初回データ送信開始: ${roomId}`);

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

    // 有効期限チェック
    const now = new Date();
    const expiresAt = new Date(room.expires_at);
    if (now > expiresAt) {
      controller.enqueue(
        `event: expired\ndata: ${JSON.stringify({
          message: 'ルームの有効期限が切れました',
        })}\n\n`
      );
      return;
    }

    // 参加者情報を取得
    const participantsResult = await query(
      'SELECT id, name, joined_at FROM participants WHERE room_id = $1 ORDER BY joined_at ASC',
      [roomId]
    );

    const data = {
      room,
      participants: participantsResult.rows,
    };

    controller.enqueue(`event: room-update\ndata: ${JSON.stringify(data)}\n\n`);
    console.log(`SSE初回データ送信完了: ${roomId}`);
  } catch (error) {
    console.error('初回ルームデータ送信エラー:', error);
    controller.enqueue(
      `event: error\ndata: ${JSON.stringify({
        error: 'データの取得に失敗しました',
      })}\n\n`
    );
  }
}

/**
 * ルームの期限切れをチェック
 * @param roomId - ルームID
 */
async function checkRoomExpiration(roomId: string) {
  try {
    const { votemEvents } = await import('@/lib/eventEmitter');

    // ルーム情報を取得
    const roomResult = await query(
      'SELECT expires_at FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) return;

    const room = roomResult.rows[0];
    const now = new Date();
    const expiresAt = new Date(room.expires_at);

    if (now > expiresAt) {
      // 期限切れイベントを発火
      votemEvents.emitRoomExpired(roomId);
    }
  } catch (error) {
    console.error('期限切れチェックエラー:', error);
  }
}
