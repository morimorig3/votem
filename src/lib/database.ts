import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// データベース接続テスト
export async function testConnection() {
  try {
    const { error } = await supabase.from('rooms').select('id').limit(1);

    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// 期限切れルームの削除
export async function cleanupExpiredRooms() {
  try {
    const { count, error } = await supabase
      .from('rooms')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Cleanup failed:', error);
    return 0;
  }
}

export default supabase;
