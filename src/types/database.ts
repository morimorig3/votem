// データベース型定義

export interface Room {
  id: string;
  title: string;
  created_at: Date;
  expires_at: Date;
  status: 'waiting' | 'voting' | 'completed';
}

export interface Participant {
  id: string;
  room_id: string;
  name: string;
  joined_at: Date;
}

export interface Vote {
  id: string;
  room_id: string;
  voter_id: string;
  candidate_id: string;
  created_at: Date;
}

// API レスポンス型
export interface RoomWithParticipants extends Room {
  participants: Participant[];
}

export interface VoteResult {
  candidate_id: string;
  candidate_name: string;
  vote_count: number;
}

export interface RoomResults {
  room: Room;
  participants: Participant[];
  votes: Vote[];
  results: VoteResult[];
  winner?: VoteResult;
}

// API リクエスト型
export interface CreateRoomRequest {
  title: string;
}

export interface JoinRoomRequest {
  name: string;
}

export interface VoteRequest {
  candidate_id: string;
}