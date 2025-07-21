#!/usr/bin/env tsx
/**
 * データベースクリーンアップスクリプト
 * 期限切れのルーム、関連する参加者、投票を削除する
 * ローカルとリモート環境の両方に対応
 */

import { createClient } from '@supabase/supabase-js';

// 環境判定
const isLocal =
  process.argv.includes('--local') || process.env.NODE_ENV === 'development';

// 環境に応じた設定
const supabaseUrl = isLocal
  ? 'http://127.0.0.1:54321' // ローカルSupabase
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseServiceKey = isLocal
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU' // ローカルのデフォルトService Role Key
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log(`🌍 環境: ${isLocal ? 'ローカル' : 'リモート'}`);
console.log(`📍 URL: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Service Role キーを使用してRLSをバイパス
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanExpiredRooms() {
  console.log('期限切れルームのクリーンアップを開始...');

  const now = new Date().toISOString();

  // 期限切れのルームを取得
  const { data: expiredRooms, error: fetchError } = await supabase
    .from('rooms')
    .select('id, title, expires_at')
    .lt('expires_at', now);

  if (fetchError) {
    console.error('期限切れルームの取得に失敗:', fetchError);
    return false;
  }

  if (!expiredRooms || expiredRooms.length === 0) {
    console.log('削除対象の期限切れルームはありません');
    return true;
  }

  console.log(`${expiredRooms.length}個の期限切れルームを削除します:`);
  expiredRooms.forEach(room => {
    console.log(`- ${room.title} (${room.id}) - 期限: ${room.expires_at}`);
  });

  // CASCADE削除によりparticipantsとvotesも自動削除される
  const { error: deleteError } = await supabase
    .from('rooms')
    .delete()
    .lt('expires_at', now);

  if (deleteError) {
    console.error('期限切れルームの削除に失敗:', deleteError);
    return false;
  }

  console.log(`${expiredRooms.length}個の期限切れルームを削除しました`);
  return true;
}

async function cleanAllData() {
  console.log('全データのクリーンアップを開始...');

  try {
    // 順序重要: 外部キー制約のため votes → participants → rooms の順で削除
    console.log('投票データを削除中...');
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 全行削除のトリック

    if (votesError) {
      console.error('投票データの削除に失敗:', votesError);
      return false;
    }

    console.log('参加者データを削除中...');
    const { error: participantsError } = await supabase
      .from('participants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (participantsError) {
      console.error('参加者データの削除に失敗:', participantsError);
      return false;
    }

    console.log('ルームデータを削除中...');
    const { error: roomsError } = await supabase
      .from('rooms')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (roomsError) {
      console.error('ルームデータの削除に失敗:', roomsError);
      return false;
    }

    console.log('全データのクリーンアップが完了しました');
    return true;
  } catch (error) {
    console.error('クリーンアップ中にエラーが発生:', error);
    return false;
  }
}

async function showStats() {
  console.log('\nデータベース統計:');

  const [roomsResult, participantsResult, votesResult] = await Promise.all([
    supabase.from('rooms').select('id', { count: 'exact' }),
    supabase.from('participants').select('id', { count: 'exact' }),
    supabase.from('votes').select('id', { count: 'exact' }),
  ]);

  console.log(`- ルーム数: ${roomsResult.count || 0}`);
  console.log(`- 参加者数: ${participantsResult.count || 0}`);
  console.log(`- 投票数: ${votesResult.count || 0}`);
}

async function main() {
  // --localフラグを除外してコマンドを取得
  const args = process.argv.filter(arg => arg !== '--local');
  const command = args[2];

  console.log('=== VoTem データベースクリーンアップツール ===\n');

  await showStats();

  switch (command) {
    case 'expired':
      console.log('\n期限切れルームのクリーンアップを実行...');
      const expiredSuccess = await cleanExpiredRooms();
      if (expiredSuccess) {
        console.log('\n期限切れルームのクリーンアップが完了しました');
        await showStats();
      }
      break;

    case 'all':
      console.log('\n⚠️  全データを削除します。この操作は取り消せません。');
      console.log('続行するには CONFIRM=yes を設定してください');

      if (process.env.CONFIRM !== 'yes') {
        console.log('操作がキャンセルされました');
        process.exit(0);
      }

      const allSuccess = await cleanAllData();
      if (allSuccess) {
        console.log('\n全データのクリーンアップが完了しました');
        await showStats();
      }
      break;

    case 'stats':
      // 統計のみ表示（既に上で表示済み）
      break;

    default:
      console.log('使用方法:');
      console.log('  npm run clean-db expired  # 期限切れルームを削除');
      console.log(
        '  npm run clean-db all      # 全データを削除 (CONFIRM=yes が必要)'
      );
      console.log('  npm run clean-db stats    # 統計のみ表示');
      console.log('\nオプション:');
      console.log('  --local                   # ローカルSupabaseを対象にする');
      console.log('\n例:');
      console.log(
        '  npm run clean-db expired --local  # ローカルの期限切れルーム削除'
      );
      console.log(
        '  CONFIRM=yes npm run clean-db all --local  # ローカルの全データ削除'
      );
      console.log('  npm run clean-db stats --local    # ローカルの統計表示');
      break;
  }
}

main().catch(console.error);
