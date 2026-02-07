
import { ScoreEntry } from '../types';

// 실제 환경에서는 @supabase/supabase-js를 사용하지만, 
// 현재 프로젝트 구조에 맞춰 LocalStorage를 활용한 집계 시스템을 구축합니다.
const LOCAL_STORAGE_KEY = 'fruit_brick_breaker_scores';
const ANALYTICS_KEY = 'fruit_brick_breaker_analytics';

export const supabaseService = {
  async getScores(): Promise<ScoreEntry[]> {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const scores: ScoreEntry[] = data ? JSON.parse(data) : [];
    // 점수 내림차순 정렬 후 상위 10개 반환
    return scores.sort((a, b) => b.score - a.score).slice(0, 10);
  },

  async submitScore(nickname: string, score: number): Promise<void> {
    if (!nickname || nickname === 'GUEST') return; // 게스트는 랭킹 등록 제외 (필요 시 변경 가능)

    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const scores: ScoreEntry[] = data ? JSON.parse(data) : [];

    const existingIndex = scores.findIndex(s => s.nickname === nickname);

    if (existingIndex > -1) {
      // 기존에 등록된 점수보다 더 높을 때만 등록
      if (score > scores[existingIndex].score) {
        scores[existingIndex].score = score;
        scores[existingIndex].created_at = new Date().toISOString();
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scores));
        } catch (e) {
          console.warn('localStorage 저장 실패 (submitScore):', e);
        }
      }
    } else {
      // 신규 등록
      scores.push({
        id: Math.random().toString(36).substring(2, 11),
        nickname,
        score,
        created_at: new Date().toISOString()
      });
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scores));
      } catch (e) {
        console.warn('localStorage 저장 실패 (submitScore):', e);
      }
    }
  },

  // 버튼 클릭수 집계 기능
  async trackAction(action: 'instagram_follow' | 'kakao_share'): Promise<void> {
    const data = localStorage.getItem(ANALYTICS_KEY);
    const stats = data ? JSON.parse(data) : { instagram_follow: 0, kakao_share: 0 };
    stats[action] = (stats[action] || 0) + 1;
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('localStorage 저장 실패 (trackAction):', e);
    }
  },

  // 관리자용 집계 데이터 조회
  async getAnalytics(): Promise<{ instagram_follow: number, kakao_share: number }> {
    const data = localStorage.getItem(ANALYTICS_KEY);
    return data ? JSON.parse(data) : { instagram_follow: 0, kakao_share: 0 };
  },

  async getAllScoresForAdmin(): Promise<ScoreEntry[]> {
     const data = localStorage.getItem(LOCAL_STORAGE_KEY);
     const scores: ScoreEntry[] = data ? JSON.parse(data) : [];
     return scores.sort((a, b) => b.score - a.score);
  },

  async resetScores(): Promise<void> {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(ANALYTICS_KEY);
  }
};
