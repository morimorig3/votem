// データベース接続テストスクリプト (TypeScript版)
import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// 環境変数読み込み
dotenv.config({ path: '.env.local' });

async function testDatabase(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Testing database connection...');
    
    // 接続テスト
    const result = await pool.query('SELECT NOW() as current_time, version()');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0]);

    // スキーマ初期化
    console.log('\n🏗️  Initializing database schema...');
    const sqlPath = path.join(process.cwd(), 'scripts', 'init-db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('✅ Database schema initialized successfully!');

    // テーブル確認
    console.log('\n📋 Checking tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Created tables:', tables.rows.map((row: { table_name: string }) => row.table_name));

    // サンプルデータ確認
    console.log('\n📊 Sample data:');
    const rooms = await pool.query('SELECT * FROM rooms');
    console.log('Rooms:', rooms.rows);

  } catch (error) {
    console.error('❌ Database test failed:', (error as Error).message);
  } finally {
    await pool.end();
  }
}

// スクリプト実行
testDatabase().catch(console.error);