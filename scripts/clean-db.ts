// データベースクリーンアップスクリプト
import dotenv from 'dotenv';
import { Pool } from 'pg';

// 環境変数読み込み
dotenv.config({ path: '.env.local' });

// データベース接続プール
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', {
      text: text.substring(0, 50) + '...',
      duration,
      rows: res.rowCount,
    });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function cleanDatabase(): Promise<void> {
  try {
    console.log('🧹 データベースのクリーンアップを開始...');

    // 期限切れルームの削除
    const expiredResult = await query(
      'DELETE FROM rooms WHERE expires_at < CURRENT_TIMESTAMP'
    );
    console.log(`✅ 期限切れルーム ${expiredResult.rowCount} 件を削除しました`);

    // 全テストデータの削除（タイトルに「テスト」を含むもの）
    const testResult = await query(
      "DELETE FROM rooms WHERE title LIKE '%テスト%'"
    );
    console.log(`✅ テストルーム ${testResult.rowCount} 件を削除しました`);

    // データベース統計表示
    console.log('\n📊 現在のデータベース状況:');

    const roomsCount = await query('SELECT COUNT(*) as count FROM rooms');
    console.log(`   ルーム数: ${roomsCount.rows[0].count}`);

    const participantsCount = await query(
      'SELECT COUNT(*) as count FROM participants'
    );
    console.log(`   参加者数: ${participantsCount.rows[0].count}`);

    const votesCount = await query('SELECT COUNT(*) as count FROM votes');
    console.log(`   投票数: ${votesCount.rows[0].count}`);

    console.log('\n🎉 データベースクリーンアップが完了しました！');
  } catch (error) {
    console.error('❌ クリーンアップ中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// スクリプト実行
cleanDatabase().catch(console.error);
