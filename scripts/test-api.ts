// API動作確認テストスクリプト
import dotenv from 'dotenv';

// 環境変数読み込み
dotenv.config({ path: '.env.local' });

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface ApiResponse {
  ok: boolean;
  status: number;
  data: unknown;
}

interface ResultsResponse {
  room: { status: string };
  results: Array<{ name: string; vote_count: number }>;
  voteStatus: {
    votedCount: number;
    totalParticipants: number;
    isComplete: boolean;
  };
  winners: Array<{ name: string; vote_count: number }>;
}

interface CreateRoomResponse {
  room: { id: string; title: string };
  url: string;
}

interface GetRoomResponse {
  room: { title: string; status: string };
  participants: Array<{ id: string; name: string }>;
}

interface ParticipantResponse {
  participant: { id: string; name: string };
}

async function apiCall(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<ApiResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, status: 0, data: { error: errorMessage } };
  }
}

async function cleanupTestData(roomId?: string) {
  if (!roomId) return;

  console.log('🧹 テストデータのクリーンアップ中...');

  try {
    // ルームを削除（CASCADE設定により参加者と投票も自動削除）
    const deleteResponse = await apiCall(`/api/rooms/${roomId}`, 'DELETE');
    if (deleteResponse.ok) {
      console.log('✅ テストデータを削除しました');
    } else {
      console.log(
        '⚠️ テストデータの削除に失敗しました（手動削除が必要かもしれません）'
      );
    }
  } catch (error) {
    console.log('⚠️ クリーンアップ中にエラーが発生しました:', error);
  }
}

async function testApiFlow() {
  console.log('🧪 API動作確認テスト開始\n');
  let roomId: string | undefined = '';

  // 1. ルーム作成テスト
  console.log('1️⃣ ルーム作成テスト');
  const createRoomResponse = await apiCall('/api/rooms', 'POST', {
    title: 'テストルーム - 今日の掃除当番',
  });

  if (!createRoomResponse.ok) {
    console.error('❌ ルーム作成失敗:', createRoomResponse.data);
    await cleanupTestData(roomId);
    return;
  }

  const createData = createRoomResponse.data as CreateRoomResponse;
  roomId = createData.room.id;
  console.log('✅ ルーム作成成功');
  console.log('   ルームID:', roomId);
  console.log('   URL:', createData.url);
  console.log('');

  // 2. ルーム情報取得テスト
  console.log('2️⃣ ルーム情報取得テスト');
  const getRoomResponse = await apiCall(`/api/rooms/${roomId}`);

  if (!getRoomResponse.ok) {
    console.error('❌ ルーム取得失敗:', getRoomResponse.data);
    await cleanupTestData(roomId);
    return;
  }

  const getRoomData = getRoomResponse.data as GetRoomResponse;
  console.log('✅ ルーム取得成功');
  console.log('   タイトル:', getRoomData.room.title);
  console.log('   ステータス:', getRoomData.room.status);
  console.log('   参加者数:', getRoomData.participants.length);
  console.log('');

  // 3. 参加者追加テスト
  console.log('3️⃣ 参加者追加テスト');
  const participants = ['田中', '佐藤', '鈴木'];
  const participantIds: string[] = [];

  for (const name of participants) {
    const addParticipantResponse = await apiCall(
      `/api/rooms/${roomId}/participants`,
      'POST',
      {
        name,
      }
    );

    if (!addParticipantResponse.ok) {
      console.error(
        `❌ 参加者追加失敗 (${name}):`,
        addParticipantResponse.data
      );
      await cleanupTestData(roomId);
      return;
    }

    const participantData = addParticipantResponse.data as ParticipantResponse;
    participantIds.push(participantData.participant.id);
    console.log(`✅ 参加者追加成功: ${name}`);
  }
  console.log('');

  // 4. 投票テスト
  console.log('4️⃣ 投票テスト');

  // 各参加者が投票
  for (let i = 0; i < participantIds.length; i++) {
    const voterId = participantIds[i];
    const selectedId = participantIds[(i + 1) % participantIds.length]; // 次の人に投票

    const voteResponse = await apiCall(`/api/rooms/${roomId}/vote`, 'POST', {
      participantId: voterId,
      selectedParticipantId: selectedId,
    });

    if (!voteResponse.ok) {
      console.error(`❌ 投票失敗 (${participants[i]}):`, {
        status: voteResponse.status,
        error: voteResponse.data,
        voterId: voterId,
        selectedId: selectedId,
      });
      await cleanupTestData(roomId);
      return;
    }

    console.log(
      `✅ 投票成功: ${participants[i]} → ${
        participants[(i + 1) % participants.length]
      }`
    );
  }
  console.log('');

  // 5. 結果取得テスト
  console.log('5️⃣ 結果取得テスト');
  const resultsResponse = await apiCall(`/api/rooms/${roomId}/results`);

  if (!resultsResponse.ok) {
    console.error('❌ 結果取得失敗:', resultsResponse.data);
    await cleanupTestData(roomId);
    return;
  }

  const resultsData = resultsResponse.data as ResultsResponse;
  console.log('✅ 結果取得成功');
  console.log('   ルームステータス:', resultsData.room.status);
  console.log(
    '   投票状況:',
    `${resultsData.voteStatus.votedCount}/${resultsData.voteStatus.totalParticipants}`
  );
  console.log('   投票完了:', resultsData.voteStatus.isComplete);
  console.log('   結果:');

  resultsData.results.forEach((result, index: number) => {
    console.log(`     ${index + 1}位: ${result.name} (${result.vote_count}票)`);
  });

  console.log('   当選者:');
  resultsData.winners.forEach(winner => {
    console.log(`     🎉 ${winner.name} (${winner.vote_count}票)`);
  });

  console.log('\n🎉 全てのAPIテストが成功しました！');

  // テストデータのクリーンアップ
  await cleanupTestData(roomId);
}

// エラーハンドリング付きでテスト実行
testApiFlow().catch(async error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
