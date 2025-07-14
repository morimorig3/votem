/**
 * ルームリアルタイム更新API（Server-Sent Events）
 * GET /api/rooms/[id]/events
 * 
 * ルーム情報と参加者リストの変更をリアルタイムでクライアントに配信します。
 * 5秒間隔でデータを送信し、ルーム有効期限の監視も行います。
 * 接続エラー時はクライアント側でHTTPポーリングにフォールバックします。
 */
import { query } from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const roomId = params.id;

  // SSEレスポンスヘッダーを設定
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  };

  // ReadableStreamを作成
  const stream = new ReadableStream({
    start(controller) {
      // 初回データ送信
      sendRoomUpdate(controller, roomId);

      // 5秒間隔でデータを送信
      const interval = setInterval(async () => {
        try {
          await sendRoomUpdate(controller, roomId);
        } catch (error) {
          console.error("SSE送信エラー:", error);
          clearInterval(interval);
          controller.close();
        }
      }, 5000);

      // 接続が閉じられた時のクリーンアップ
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}

async function sendRoomUpdate(
  controller: ReadableStreamDefaultController,
  roomId: string
) {
  try {
    // ルーム情報を取得
    const roomResult = await query(
      "SELECT id, title, created_at, expires_at, status FROM rooms WHERE id = $1",
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      // ルームが見つからない場合は終了イベントを送信
      controller.enqueue(
        `event: error\ndata: ${JSON.stringify({
          error: "ルームが見つかりません",
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
          message: "ルームの有効期限が切れました",
        })}\n\n`
      );
      return;
    }

    // 参加者情報を取得
    const participantsResult = await query(
      "SELECT id, name, joined_at FROM participants WHERE room_id = $1 ORDER BY joined_at ASC",
      [roomId]
    );

    const participants = participantsResult.rows;

    // データを送信
    const data = {
      room: {
        id: room.id,
        title: room.title,
        created_at: room.created_at,
        expires_at: room.expires_at,
        status: room.status,
      },
      participants,
    };

    controller.enqueue(`event: room-update\ndata: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    console.error("ルームデータ取得エラー:", error);
    controller.enqueue(
      `event: error\ndata: ${JSON.stringify({
        error: "データの取得に失敗しました",
      })}\n\n`
    );
  }
}
