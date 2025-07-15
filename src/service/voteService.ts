import { ResultsData } from '@/types/database';

interface VoteRequest {
  participantId: string;
  selectedParticipantId: string;
}

interface VoteResponse {
  success: boolean;
  message: string;
}

export const submitVote = async (
  roomId: string,
  participantId: string,
  selectedParticipantId: string
): Promise<VoteResponse> => {
  const response = await fetch(`/api/rooms/${roomId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      participantId,
      selectedParticipantId,
    } as VoteRequest),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '投票に失敗しました');
  }

  return data;
};

export const getVoteResults = async (roomId: string): Promise<ResultsData> => {
  const response = await fetch(`/api/rooms/${roomId}/results`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '結果の取得に失敗しました');
  }

  return data;
};