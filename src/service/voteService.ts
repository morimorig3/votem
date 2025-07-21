import { ResultsData } from '@/types/database';
import { supabase } from '@/lib/database';

interface VoteResponse {
  success: boolean;
  message: string;
}

export const submitVote = async (
  roomId: string,
  participantId: string,
  selectedParticipantId: string
): Promise<VoteResponse> => {
  // ルームが投票中かチェック
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('status, expires_at')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    throw new Error('ルームが見つかりません');
  }

  if (room.status !== 'voting') {
    throw new Error('投票が開始されていません');
  }

  // 有効期限チェック
  const now = new Date();
  const expiresAt = new Date(room.expires_at);
  if (now > expiresAt) {
    throw new Error('ルームの有効期限が切れています');
  }

  // 投票者と候補者が同じルームの参加者かチェック
  const uniqueIds = [...new Set([participantId, selectedParticipantId])];
  const { data: participants, error: participantsError } = await supabase
    .from('participants')
    .select('id')
    .eq('room_id', roomId)
    .in('id', uniqueIds);

  if (
    participantsError ||
    !participants ||
    participants.length !== uniqueIds.length
  ) {
    throw new Error('無効な参加者IDです');
  }

  // 既に投票済みかチェック
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('room_id', roomId)
    .eq('voter_id', participantId)
    .single();

  if (existingVote) {
    throw new Error('既に投票済みです');
  }

  // 投票を記録
  const { error: voteError } = await supabase.from('votes').insert({
    room_id: roomId,
    voter_id: participantId,
    candidate_id: selectedParticipantId,
  });

  if (voteError) {
    throw new Error(voteError.message || '投票に失敗しました');
  }

  return {
    success: true,
    message: '投票が完了しました',
  };
};

export const getVoteResults = async (roomId: string): Promise<ResultsData> => {
  // ルーム情報を取得
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    throw new Error('ルームが見つかりません');
  }

  // 参加者一覧を取得
  const { data: participants, error: participantsError } = await supabase
    .from('participants')
    .select('id, name')
    .eq('room_id', roomId);

  if (participantsError) {
    throw new Error(participantsError.message || '参加者の取得に失敗しました');
  }

  // 各参加者への投票数を計算
  const voteCountPromises = participants.map(async participant => {
    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('candidate_id', participant.id);

    if (error) {
      console.error(`参加者 ${participant.name} の投票数取得エラー:`, error);
      return { ...participant, vote_count: 0 };
    }

    return { ...participant, vote_count: count || 0 };
  });

  const resultsWithVotes = await Promise.all(voteCountPromises);

  // 投票状況を計算
  const [votedCountResult, totalParticipantsResult] = await Promise.all([
    supabase
      .from('votes')
      .select('voter_id', { count: 'exact' })
      .eq('room_id', roomId),

    supabase
      .from('participants')
      .select('id', { count: 'exact' })
      .eq('room_id', roomId),
  ]);

  const votedCount = votedCountResult.count || 0;
  const totalParticipants = totalParticipantsResult.count || 0;

  const formattedResults = resultsWithVotes.sort(
    (a, b) => b.vote_count - a.vote_count || a.name.localeCompare(b.name)
  );

  // 勝者を決定
  const maxVotes =
    formattedResults.length > 0 ? formattedResults[0].vote_count : 0;
  const winners = formattedResults.filter(
    result => result.vote_count === maxVotes && maxVotes > 0
  );

  return {
    room,
    results: formattedResults,
    voteStatus: {
      votedCount,
      totalParticipants,
      isComplete: votedCount === totalParticipants && totalParticipants > 0,
    },
    winners,
  };
};
