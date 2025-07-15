/**
 * SSE接続管理システム
 * 
 * アクティブなSSE接続を管理し、ルーム別のクライアント通知を効率的に行います。
 * メモリリークを防ぎ、接続の自動クリーンアップを提供します。
 */
import { votemEvents } from './eventEmitter';
import { query } from './database';

interface SSEConnection {
  controller: ReadableStreamDefaultController;
  roomId: string;
  type: 'room' | 'results';
  connectedAt: Date;
  lastActivity: Date;
}

class SSEManager {
  private connections = new Map<string, SSEConnection>();
  private roomConnections = new Map<string, Set<string>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * 新しいSSE接続を登録
   * @param connectionId - 接続ID（ユニーク）
   * @param controller - ReadableStreamController
   * @param roomId - ルームID
   * @param type - 接続タイプ（room | results）
   */
  addConnection(
    connectionId: string,
    controller: ReadableStreamDefaultController,
    roomId: string,
    type: 'room' | 'results'
  ) {
    const connection: SSEConnection = {
      controller,
      roomId,
      type,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.connections.set(connectionId, connection);

    // ルーム別接続管理
    if (!this.roomConnections.has(roomId)) {
      this.roomConnections.set(roomId, new Set());
    }
    this.roomConnections.get(roomId)!.add(connectionId);

    // イベントリスナーを設定
    this.setupEventListeners(connectionId, roomId, type);

    console.log(
      `SSE接続追加: ${connectionId} (ルーム: ${roomId}, タイプ: ${type})`
    );
    console.log(`アクティブ接続数: ${this.connections.size}`);
    console.log(`ルーム ${roomId} の接続数: ${this.getConnectionCount(roomId)}`);
  }

  /**
   * SSE接続を削除
   * @param connectionId - 接続ID
   */
  removeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { roomId } = connection;

    // 接続を削除
    this.connections.delete(connectionId);

    // ルーム別接続から削除
    const roomConnections = this.roomConnections.get(roomId);
    if (roomConnections) {
      roomConnections.delete(connectionId);
      if (roomConnections.size === 0) {
        this.roomConnections.delete(roomId);
        // ルームに接続がなくなったらイベントリスナーをクリーンアップ
        votemEvents.removeRoomListeners(roomId);
      }
    }

    console.log(
      `SSE接続削除: ${connectionId} (ルーム: ${roomId})`
    );
    console.log(`アクティブ接続数: ${this.connections.size}`);
  }

  /**
   * 特定ルームの全接続に通知
   * @param roomId - ルームID
   * @param event - イベント名
   * @param data - 送信データ
   * @param type - 対象の接続タイプ（省略時は全て）
   */
  notifyRoom(
    roomId: string,
    event: string,
    data: unknown,
    type?: 'room' | 'results'
  ) {
    const roomConnections = this.roomConnections.get(roomId);
    if (!roomConnections) return;

    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    let sentCount = 0;

    for (const connectionId of roomConnections) {
      const connection = this.connections.get(connectionId);
      if (!connection) continue;

      // タイプフィルター
      if (type && connection.type !== type) continue;

      try {
        connection.controller.enqueue(message);
        connection.lastActivity = new Date();
        sentCount++;
      } catch (error) {
        console.error(`SSE送信エラー (${connectionId}):`, error);
        this.removeConnection(connectionId);
      }
    }

    console.log(
      `ルーム ${roomId} に通知送信: ${event} (${sentCount}件)`
    );
  }

  /**
   * 期限切れエラーを特定ルームに送信
   * @param roomId - ルームID
   */
  notifyRoomExpired(roomId: string) {
    this.notifyRoom(roomId, 'expired', {
      message: 'ルームの有効期限が切れました',
    });
  }

  /**
   * エラーを特定ルームに送信
   * @param roomId - ルームID
   * @param error - エラーメッセージ
   * @param type - 対象の接続タイプ
   */
  notifyError(roomId: string, error: string, type?: 'room' | 'results') {
    this.notifyRoom(roomId, 'error', { error }, type);
  }

  /**
   * 接続が生きているかチェック
   * @param connectionId - 接続ID
   */
  isConnectionAlive(connectionId: string): boolean {
    return this.connections.has(connectionId);
  }

  /**
   * アクティブな接続数を取得
   * @param roomId - ルームID（省略時は全体）
   */
  getConnectionCount(roomId?: string): number {
    if (roomId) {
      return this.roomConnections.get(roomId)?.size || 0;
    }
    return this.connections.size;
  }

  /**
   * イベントリスナーを設定
   * @param connectionId - 接続ID
   * @param roomId - ルームID
   * @param type - 接続タイプ
   */
  private setupEventListeners(
    connectionId: string,
    roomId: string,
    type: 'room' | 'results'
  ) {
    if (type === 'room') {
      // ルーム更新イベント
      votemEvents.onRoomUpdate(roomId, () => {
        if (this.isConnectionAlive(connectionId)) {
          this.sendRoomData(roomId);
        }
      });
    } else if (type === 'results') {
      // 結果更新イベント
      votemEvents.onResultsUpdate(roomId, () => {
        if (this.isConnectionAlive(connectionId)) {
          this.sendResultsData(roomId);
        }
      });
    }

    // 期限切れイベント（共通）
    votemEvents.onRoomExpired(roomId, () => {
      this.notifyRoomExpired(roomId);
    });
  }

  /**
   * ルームデータを取得して送信
   * @param roomId - ルームID
   */
  private async sendRoomData(roomId: string) {
    try {

      // ルーム情報を取得
      const roomResult = await query(
        'SELECT id, title, created_at, expires_at, status FROM rooms WHERE id = $1',
        [roomId]
      );

      if (roomResult.rows.length === 0) {
        this.notifyError(roomId, 'ルームが見つかりません', 'room');
        return;
      }

      const room = roomResult.rows[0];

      // 期限切れチェック
      const now = new Date();
      const expiresAt = new Date(room.expires_at);
      if (now > expiresAt) {
        votemEvents.emitRoomExpired(roomId);
        return;
      }

      // 参加者情報を取得
      const participantsResult = await query(
        'SELECT id, name, joined_at FROM participants WHERE room_id = $1 ORDER BY joined_at ASC',
        [roomId]
      );

      const data = {
        room,
        participants: participantsResult.rows,
      };

      this.notifyRoom(roomId, 'room-update', data, 'room');
    } catch (error) {
      console.error('ルームデータ取得エラー:', error);
      this.notifyError(roomId, 'データの取得に失敗しました', 'room');
    }
  }

  /**
   * 結果データを取得して送信
   * @param roomId - ルームID
   */
  private async sendResultsData(roomId: string) {
    try {

      // ルーム情報を取得
      const roomResult = await query(
        'SELECT id, title, created_at, expires_at, status FROM rooms WHERE id = $1',
        [roomId]
      );

      if (roomResult.rows.length === 0) {
        this.notifyError(roomId, 'ルームが見つかりません', 'results');
        return;
      }

      const room = roomResult.rows[0];

      // 投票結果を取得
      const resultsQuery = `
        SELECT 
          p.id,
          p.name,
          COUNT(v.id) as vote_count
        FROM participants p
        LEFT JOIN votes v ON p.id = v.candidate_id
        WHERE p.room_id = $1
        GROUP BY p.id, p.name
        ORDER BY vote_count DESC, p.name ASC
      `;

      const resultsResult = await query(resultsQuery, [roomId]);
      const results = resultsResult.rows.map(row => ({
        ...row,
        vote_count: parseInt(row.vote_count),
      }));

      // 投票状況を取得
      const voteStatusQuery = `
        SELECT 
          COUNT(DISTINCT v.voter_id) as voted_count,
          COUNT(DISTINCT p.id) as total_participants
        FROM participants p
        LEFT JOIN votes v ON p.id = v.voter_id AND v.room_id = $1
        WHERE p.room_id = $1
      `;

      const voteStatusResult = await query(voteStatusQuery, [roomId]);
      const voteStatus = voteStatusResult.rows[0];
      const votedCount = parseInt(voteStatus.voted_count);
      const totalParticipants = parseInt(voteStatus.total_participants);

      // 勝者を決定
      const maxVotes = results.length > 0 ? results[0].vote_count : 0;
      const winners = results.filter(
        result => result.vote_count === maxVotes && maxVotes > 0
      );

      const data = {
        room,
        results,
        voteStatus: {
          votedCount,
          totalParticipants,
          isComplete: votedCount === totalParticipants && totalParticipants > 0,
        },
        winners,
      };

      this.notifyRoom(roomId, 'results-update', data, 'results');
    } catch (error) {
      console.error('結果データ取得エラー:', error);
      this.notifyError(roomId, 'データの取得に失敗しました', 'results');
    }
  }

  /**
   * 定期的に非アクティブな接続をクリーンアップ
   */
  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      const timeoutMs = 5 * 60 * 1000; // 5分

      for (const [connectionId, connection] of this.connections) {
        const inactiveTime = now.getTime() - connection.lastActivity.getTime();
        if (inactiveTime > timeoutMs) {
          console.log(`非アクティブ接続をクリーンアップ: ${connectionId}`);
          this.removeConnection(connectionId);
        }
      }
    }, 60000); // 1分間隔でチェック
  }

  /**
   * マネージャーの終了処理
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.connections.clear();
    this.roomConnections.clear();
  }
}

// シングルトンインスタンス
export const sseManager = new SSEManager();

/**
 * 接続IDを生成
 */
export function generateConnectionId(): string {
  return `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}