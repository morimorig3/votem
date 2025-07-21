import { Participant } from '@/types/database';
import { supabase } from '@/lib/database';

interface JoinRoomResponse {
  participant: Participant;
}

export const joinRoom = async (
  roomId: string,
  name: string
): Promise<JoinRoomResponse> => {
  // ルームが存在し、有効期限内かチェック
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, expires_at, status')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    throw new Error('ルームが見つかりません');
  }

  // 有効期限チェック
  const now = new Date();
  const expiresAt = new Date(room.expires_at);
  if (now > expiresAt) {
    throw new Error('ルームの有効期限が切れています');
  }

  // 投票中は参加を拒否
  if (room.status === 'voting') {
    throw new Error('投票中のため参加できません');
  }

  // 同じ名前の参加者が既に存在するかチェック
  const { data: existingParticipants } = await supabase
    .from('participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('name', name.trim());

  if (existingParticipants && existingParticipants.length > 0) {
    throw new Error('同じ名前の参加者が既に存在します');
  }

  // 参加者を追加
  const { data: participant, error } = await supabase
    .from('participants')
    .insert({
      room_id: roomId,
      name: name.trim(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || '参加に失敗しました');
  }

  return { participant };
};
