/**
 * VoTem イベント管理システム
 * 
 * ルーム関連のイベントを管理し、SSE接続にリアルタイム通知を提供します。
 * Node.js EventEmitterを使用してイベント駆動型の通信を実現します。
 */
import { EventEmitter } from 'events';

class VoTemEventEmitter extends EventEmitter {
  constructor() {
    super();
    // メモリリーク防止のためにリスナー数制限を増加
    this.setMaxListeners(100);
  }

  /**
   * ルーム情報が更新された時のイベント
   * @param roomId - ルームID
   * @param data - 更新されたルームデータ
   */
  emitRoomUpdate(roomId: string, data?: unknown) {
    this.emit(`room:${roomId}:update`, data);
  }

  /**
   * 参加者が追加された時のイベント
   * @param roomId - ルームID
   * @param participantData - 参加者データ
   */
  emitParticipantJoined(roomId: string, participantData: unknown) {
    this.emit(`room:${roomId}:participant:joined`, participantData);
    // ルーム更新イベントも発火
    this.emit(`room:${roomId}:update`);
  }

  /**
   * 投票が実行された時のイベント
   * @param roomId - ルームID
   * @param voteData - 投票データ
   */
  emitVoteCast(roomId: string, voteData: unknown) {
    this.emit(`room:${roomId}:vote:cast`, voteData);
    // 結果更新イベントも発火
    this.emit(`room:${roomId}:results:update`);
  }

  /**
   * ルームステータスが変更された時のイベント
   * @param roomId - ルームID
   * @param status - 新しいステータス
   */
  emitRoomStatusChanged(roomId: string, status: string) {
    this.emit(`room:${roomId}:status:changed`, status);
    // ルーム更新と結果更新イベントも発火
    this.emit(`room:${roomId}:update`);
    this.emit(`room:${roomId}:results:update`);
  }

  /**
   * 投票結果が更新された時のイベント
   * @param roomId - ルームID
   * @param resultsData - 結果データ
   */
  emitResultsUpdate(roomId: string, resultsData?: unknown) {
    this.emit(`room:${roomId}:results:update`, resultsData);
  }

  /**
   * ルームが期限切れになった時のイベント
   * @param roomId - ルームID
   */
  emitRoomExpired(roomId: string) {
    this.emit(`room:${roomId}:expired`);
  }

  /**
   * ルーム更新イベントのリスナーを追加
   * @param roomId - ルームID
   * @param listener - リスナー関数
   */
  onRoomUpdate(roomId: string, listener: (data?: unknown) => void) {
    this.on(`room:${roomId}:update`, listener);
  }

  /**
   * 結果更新イベントのリスナーを追加
   * @param roomId - ルームID
   * @param listener - リスナー関数
   */
  onResultsUpdate(roomId: string, listener: (data?: unknown) => void) {
    this.on(`room:${roomId}:results:update`, listener);
  }

  /**
   * 期限切れイベントのリスナーを追加
   * @param roomId - ルームID
   * @param listener - リスナー関数
   */
  onRoomExpired(roomId: string, listener: () => void) {
    this.on(`room:${roomId}:expired`, listener);
  }

  /**
   * 特定ルームの全リスナーを削除
   * @param roomId - ルームID
   */
  removeRoomListeners(roomId: string) {
    this.removeAllListeners(`room:${roomId}:update`);
    this.removeAllListeners(`room:${roomId}:results:update`);
    this.removeAllListeners(`room:${roomId}:expired`);
    this.removeAllListeners(`room:${roomId}:participant:joined`);
    this.removeAllListeners(`room:${roomId}:vote:cast`);
    this.removeAllListeners(`room:${roomId}:status:changed`);
  }

  /**
   * 現在のリスナー数を取得（デバッグ用）
   * @param roomId - ルームID
   */
  getListenerCount(roomId: string): {
    roomUpdate: number;
    resultsUpdate: number;
    expired: number;
  } {
    return {
      roomUpdate: this.listenerCount(`room:${roomId}:update`),
      resultsUpdate: this.listenerCount(`room:${roomId}:results:update`),
      expired: this.listenerCount(`room:${roomId}:expired`),
    };
  }
}

// シングルトンインスタンス
export const votemEvents = new VoTemEventEmitter();

// イベント名の定数
export const EVENTS = {
  ROOM_UPDATE: 'room:update',
  PARTICIPANT_JOINED: 'participant:joined',
  VOTE_CAST: 'vote:cast',
  ROOM_STATUS_CHANGED: 'status:changed',
  RESULTS_UPDATE: 'results:update',
  ROOM_EXPIRED: 'expired',
} as const;