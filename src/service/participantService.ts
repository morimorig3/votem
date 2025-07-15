import { Participant } from '@/types/database';

interface JoinRoomRequest {
  name: string;
}

interface JoinRoomResponse {
  participant: Participant;
}

export const joinRoom = async (
  roomId: string,
  name: string
): Promise<JoinRoomResponse> => {
  const response = await fetch(`/api/rooms/${roomId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: name.trim() } as JoinRoomRequest),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '参加に失敗しました');
  }

  return data;
};