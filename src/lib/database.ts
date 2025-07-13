import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// データベース接続プール
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// データベース接続関数
export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// データベース接続テスト
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// データベース初期化（テーブル作成）
export async function initializeDatabase() {
  try {
    const sqlPath = path.join(process.cwd(), 'scripts', 'init-db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await query(sql);
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// 期限切れルームの削除
export async function cleanupExpiredRooms() {
  try {
    const result = await query(
      'DELETE FROM rooms WHERE expires_at < CURRENT_TIMESTAMP'
    );
    console.log(`Cleaned up ${result.rowCount} expired rooms`);
    return result.rowCount;
  } catch (error) {
    console.error('Cleanup failed:', error);
    return 0;
  }
}

export default pool;