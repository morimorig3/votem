/**
 * ルーム作成API
 * POST /api/rooms
 * 
 * 新しい投票ルームを作成し、30分の有効期限を設定します。
 * 作成されたルームのIDとアクセス用URLを返します。
 */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/database';
import { Room } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    const roomId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30分後

    const result = await query(
      `INSERT INTO rooms (id, title, created_at, expires_at, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [roomId, title.trim(), now, expiresAt, 'waiting']
    );

    const room: Room = result.rows[0];

    return NextResponse.json({
      room,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/rooms/${roomId}`
    });

  } catch (error) {
    console.error('ルーム作成エラー:', error);
    return NextResponse.json(
      { error: 'ルームの作成に失敗しました' },
      { status: 500 }
    );
  }
}