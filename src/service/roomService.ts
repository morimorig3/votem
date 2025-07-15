import { Room, RoomData } from '@/types/database';

interface CreateRoomRequest {
  title: string;
}

interface CreateRoomResponse {
  room: Room;
  url: string;
}

export const createRoom = async (
  title: string
): Promise<CreateRoomResponse> => {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: title.trim() } as CreateRoomRequest),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'ルームの作成に失敗しました');
  }

  return data;
};

export const getRoomData = async (roomId: string): Promise<RoomData> => {
  const response = await fetch(`/api/rooms/${roomId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'ルーム情報の取得に失敗しました');
  }

  return data;
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
  const response = await fetch(`/api/rooms/${roomId}/start-voting`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ participantId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '投票開始に失敗しました');
  }

  return data;
};