
import { createClient } from '@supabase/supabase-js';
import { ScoreEntry } from '../types';
import { GAME_CONFIG } from '../constants';

const supabase = createClient(
  GAME_CONFIG.SUPABASE_URL,
  GAME_CONFIG.SUPABASE_ANON_KEY
);

// 가장 최근 수요일 00:00 KST 계산
function getLastWednesdayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC → KST
  const day = kst.getUTCDay(); // 0=일 ~ 6=토
  const diff = day >= 3 ? day - 3 : day + 4; // 수요일(3)까지 거리
  kst.setUTCDate(kst.getUTCDate() - diff);
  kst.setUTCHours(0, 0, 0, 0);
  // KST → UTC로 변환해서 반환
  return new Date(kst.getTime() - 9 * 60 * 60 * 1000).toISOString();
}

export const supabaseService = {
  async getScores(): Promise<ScoreEntry[]> {
    const since = getLastWednesdayKST();
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .gte('created_at', since)
      .order('score', { ascending: false })
      .limit(10);
    if (error) { console.warn('getScores 실패:', error); return []; }
    return data || [];
  },

  async submitScore(nickname: string, score: number): Promise<void> {
    if (!nickname || nickname === 'GUEST') return;

    const { data: existing } = await supabase
      .from('scores')
      .select('*')
      .eq('nickname', nickname)
      .maybeSingle();

    if (existing) {
      if (score > existing.score) {
        await supabase
          .from('scores')
          .update({ score, created_at: new Date().toISOString() })
          .eq('nickname', nickname);
      }
    } else {
      await supabase
        .from('scores')
        .insert({ nickname, score });
    }
  },

  async trackAction(action: 'instagram_follow' | 'kakao_share'): Promise<void> {
    const { error } = await supabase
      .from('analytics')
      .insert({ action });
    if (error) console.warn('trackAction 실패:', error);
  },

  async getAnalytics(): Promise<{ instagram_follow: number; kakao_share: number }> {
    const { data, error } = await supabase
      .from('analytics')
      .select('action');
    if (error || !data) return { instagram_follow: 0, kakao_share: 0 };
    return {
      instagram_follow: data.filter(d => d.action === 'instagram_follow').length,
      kakao_share: data.filter(d => d.action === 'kakao_share').length,
    };
  },

  async getAllScoresForAdmin(): Promise<ScoreEntry[]> {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false });
    if (error) { console.warn('getAllScoresForAdmin 실패:', error); return []; }
    return data || [];
  },

  async resetScores(): Promise<void> {
    await supabase.from('scores').delete().neq('id', '');
    await supabase.from('analytics').delete().neq('id', '');
  }
};
