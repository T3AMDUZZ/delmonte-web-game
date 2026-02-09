-- ============================================
-- 델몬트 과일 벽돌깨기 - Supabase 테이블 설정
-- Supabase 대시보드 → SQL Editor에 붙여넣기 후 실행
-- ============================================

-- 1. 스코어 테이블
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 분석(analytics) 테이블
CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0
);

-- 3. 기본 분석 데이터 삽입
INSERT INTO analytics (action, count) VALUES
  ('instagram_follow', 0),
  ('kakao_share', 0);

-- 4. 인덱스 (랭킹 조회 성능)
CREATE INDEX idx_scores_score ON scores (score DESC);
CREATE INDEX idx_scores_nickname ON scores (nickname);

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 - anon key로 접근 허용
-- 스코어: 누구나 조회/등록 가능
CREATE POLICY "scores_select" ON scores FOR SELECT USING (true);
CREATE POLICY "scores_insert" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "scores_update" ON scores FOR UPDATE USING (true);
CREATE POLICY "scores_delete" ON scores FOR DELETE USING (true);

-- 분석: 누구나 조회/수정 가능
CREATE POLICY "analytics_select" ON analytics FOR SELECT USING (true);
CREATE POLICY "analytics_update" ON analytics FOR UPDATE USING (true);
