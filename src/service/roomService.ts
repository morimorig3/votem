import { Room, RoomData } from '@/types/database';
import { supabase } from '@/lib/database';

interface CreateRoomResponse {
  room: Room;
  url: string;
}

export const createRoom = async (
  title: string
): Promise<CreateRoomResponse> => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      title: title.trim(),
      expires_at: expiresAt.toISOString(),
      status: 'waiting',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'ルームの作成に失敗しました');
  }

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/rooms/${data.id}`;

  return {
    room: data,
    url,
  };
};

export const getRoomData = async (roomId: string): Promise<RoomData> => {
  const [roomResult, participantsResult, votedParticipantsResult] =
    await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),

      supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true }),

      supabase.from('votes').select('voter_id').eq('room_id', roomId),
    ]);

  if (roomResult.error) {
    throw new Error(
      roomResult.error.message || 'ルーム情報の取得に失敗しました'
    );
  }

  if (participantsResult.error) {
    throw new Error(
      participantsResult.error.message || '参加者情報の取得に失敗しました'
    );
  }

  if (votedParticipantsResult.error) {
    throw new Error(
      votedParticipantsResult.error.message || '投票状況の取得に失敗しました'
    );
  }

  return {
    room: roomResult.data,
    participants: participantsResult.data,
    votedParticipantIds: votedParticipantsResult.data.map(
      vote => vote.voter_id
    ),
  };
};

interface StartVotingResponse {
  success: boolean;
  message: string;
  roomStatus: string;
}

export const startVoting = async (
  roomId: string,
  participantId: string
): Promise<StartVotingResponse> => {
  // 参加者が存在するかチェック
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id')
    .eq('id', participantId)
    .eq('room_id', roomId)
    .single();

  if (participantError || !participant) {
    throw new Error('参加者が見つかりません');
  }

  // ルームのステータスを'voting'に更新
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'voting' })
    .eq('id', roomId)
    .eq('status', 'waiting');

  if (error) {
    throw new Error(error.message || '投票開始に失敗しました');
  }

  return {
    success: true,
    message: '投票が開始されました',
    roomStatus: 'voting',
  };
};

interface CancelVotingResponse {
  success: boolean;
}

export const cancelVoting = async (
  roomId: string,
  participantId: string
): Promise<CancelVotingResponse> => {
  // 参加者が存在するかチェック
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id')
    .eq('id', participantId)
    .eq('room_id', roomId)
    .single();

  if (participantError || !participant) {
    throw new Error('参加者が見つかりません');
  }

  // 投票を削除してルームのステータスを'waiting'に戻す
  const [deleteResult, updateResult] = await Promise.all([
    supabase.from('votes').delete().eq('room_id', roomId),
    supabase.from('rooms').update({ status: 'waiting' }).eq('id', roomId),
  ]);

  if (deleteResult.error) {
    throw new Error(
      deleteResult.error.message || '投票のキャンセルに失敗しました'
    );
  }

  if (updateResult.error) {
    throw new Error(
      updateResult.error.message || 'ルームステータスの更新に失敗しました'
    );
  }

  return {
    success: true,
  };
};
