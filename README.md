<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Delmont Fruit Brick Breaker

## 프로젝트 개요

- **프로젝트명:** Delmont Fruit Brick Breaker
- **기술 스택:** React 19 + TypeScript 5.7 + Vite 6 + Tailwind CSS (CDN)
- **게임 유형:** 레트로 스타일 과일 테마 벽돌 깨기 웹 게임
- **주요 기능:** 인스타그램 팔로우 게이트, 카카오톡 공유, 랭킹 시스템, 관리자 패널

View your app in AI Studio: https://ai.studio/apps/drive/1vBaigmCwpggSEY-k3z1mj0MIlv4988G5

## 디렉토리 구조

```
├── App.tsx                    # 메인 앱 컴포넌트
├── index.tsx                  # 엔트리 포인트
├── types.ts                   # TypeScript 타입 정의
├── constants.tsx              # 게임 설정 상수 + 맵 패턴 20종
├── components/
│   ├── InstagramGate.tsx      # 인스타그램 팔로우 게이트
│   ├── LoginScreen.tsx        # 닉네임 입력
│   ├── GameCanvas.tsx         # 핵심 게임 로직 (Canvas)
│   ├── RankingBoard.tsx       # 랭킹 + 카카오 공유
│   └── AdminPanel.tsx         # 관리자 패널
├── services/
│   └── supabase.ts            # 데이터 저장 (LocalStorage)
└── public/assets/             # 이미지/사운드 리소스
```

## 실행 방법

**Prerequisites:** Node.js

```bash
npm install
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
```

## 최근 변경사항 (v1.1.0 - 버그 수정)

### GameCanvas 핵심 로직
- 공 속도 상수를 `GAME_CONFIG.INITIAL_BALL_SPEED`로 통일 (하드코딩 제거)
- 레벨업 시 비동기 state 문제 해결 (`resetGame`에 `lvlOverride` 매개변수 추가)
- RAINBOW 벽돌 공 복제 시 `dy`를 `-Math.abs()`로 보장 (아래로 향하는 버그 수정)
- 패들 충돌 시 `ball.dy = -Math.abs(ball.dy)` 명시 설정
- 충돌 감지 코너 케이스 방어 코드 추가 (`minO <= 0`)
- 미사용 `tick` 상태 제거 (불필요한 리렌더링 방지)

### 오디오/렌더링
- `requestAnimationFrame` 누수 방지 (`isPaused` 등을 ref 미러링)
- BGM Audio 객체 메모리 누수 방지 (`removeAttribute` + `load` 패턴)
- SFX Audio 재생 후 정리 (`ended` 이벤트 리스너)

### RankingBoard
- `useEffect`를 3개로 분리 (데이터 로딩/BGM 초기화/볼륨 업데이트)
- `isBgmMuted` 조건 반영
- BGM cleanup 강화

### App.tsx
- `RankingBoard`에 `isBgmMuted` prop 전달 추가

### InstagramGate
- PC 클릭 사운드 재생 수정 (모든 환경에서 클릭음 재생)

### supabase.ts
- deprecated `substr()` → `substring()` 변경
- `localStorage.setItem()` try-catch 에러 처리 추가
- `getAllScoresForAdmin` 점수 내림차순 정렬 추가

### constants.tsx
- 중복 음향 리소스(`HIT3`, `BREAK`) TODO 주석 추가

## 알려진 이슈

- iOS 모바일에서 BGM 자동재생 정책으로 인한 BGM 미재생 가능성
- 모바일에서 `touchStart` 미처리 (첫 터치 시 패들 즉시 반응 안 함)
- 특수 벽돌(`BOMB`/`CROSS`/`RAINBOW`/`GRAY`)이 DOM 렌더링으로 모바일 성능 이슈 가능
- 관리자 비밀번호가 클라이언트에 하드코딩 (보안 주의)
- Kakao API Key가 소스에 하드코딩
