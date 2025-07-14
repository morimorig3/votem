/**
 * ルーム情報取得・削除API
 * GET /api/rooms/[id] - ルーム情報と参加者リストを取得
 * DELETE /api/rooms/[id] - ルームとその関連データを削除
 *
 * ルームの有効期限チェックも実行します。
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { Room, Participant } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;

    if (!roomId) {
      return NextResponse.json(
        { error: 'ルームIDが必要です' },
        { status: 400 }
      );
    }

    // ルーム情報取得
    const roomResult = await query('SELECT * FROM rooms WHERE id = $1', [
      roomId,
    ]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'ルームが見つかりません' },
        { status: 404 }
      );
    }

    const room: Room = roomResult.rows[0];

    // 期限切れチェック
    if (new Date() > new Date(room.expires_at)) {
      return NextResponse.json(
        { error: 'ルームの有効期限が切れています' },
        { status: 410 }
      );
    }

    // 参加者情報取得
    const participantsResult = await query(
      'SELECT * FROM participants WHERE room_id = $1 ORDER BY joined_at',
      [roomId]
    );

    const participants: Participant[] = participantsResult.rows;

    return NextResponse.json({
      room,
      participants,
    });
  } catch (error) {
    console.error('ルーム取得エラー:', error);
    return NextResponse.json(
      { error: 'ルーム情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;

    if (!roomId) {
      return NextResponse.json(
        { error: 'ルームIDが必要です' },
        { status: 400 }
      );
    }

    // ルーム存在チェック
    const roomResult = await query('SELECT * FROM rooms WHERE id = $1', [
      roomId,
    ]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'ルームが見つかりません' },
        { status: 404 }
      );
    }

    // ルーム削除（CASCADE設定により関連データも自動削除）
    await query('DELETE FROM rooms WHERE id = $1', [roomId]);

    return NextResponse.json({
      success: true,
      message: 'ルームが削除されました',
    });
  } catch (error) {
    console.error('ルーム削除エラー:', error);
    return NextResponse.json(
      { error: 'ルームの削除に失敗しました' },
      { status: 500 }
    );
  }
}
