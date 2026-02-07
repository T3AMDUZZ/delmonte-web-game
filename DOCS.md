# 델몬트 브릭 브레이커 - 버그 분석 및 수정 보고서

## 문서 정보
- 작성일: 2026-02-07
- 분석 대상: v1.0.0 (초기 커밋)
- 수정 버전: v1.1.0

---

## 1. 발견된 문제점 (총 40건)

### 1.1 해결 완료 (19건)

#### Critical (1건 → 0건 잔여)
| # | 파일 | 문제 | 수정 내용 | 상태 |
|---|------|------|-----------|------|
| 1 | GameCanvas.tsx | 충돌 감지 코너 케이스에서 minO 음수 시 비정상 반사 | minO <= 0 방어 코드 추가 | 해결 |

#### High (9건 해결)
| # | 파일 | 문제 | 수정 내용 | 상태 |
|---|------|------|-----------|------|
| 2 | GameCanvas.tsx | 공 속도 상수 불일치 (하드코딩 4 vs config 3.6) | GAME_CONFIG.INITIAL_BALL_SPEED 사용 | 해결 |
| 3 | GameCanvas.tsx | 레벨업 시 비동기 state로 이전 level 사용 | resetGame에 lvlOverride 매개변수 추가 | 해결 |
| 4 | GameCanvas.tsx | RAINBOW 공 복제 시 dy 반전으로 아래로 향함 | dy: -Math.abs(sourceBall.dy) | 해결 |
| 5 | GameCanvas.tsx | 패들 충돌 후 dy 미재설정 | ball.dy = -Math.abs(ball.dy) | 해결 |
| 6 | GameCanvas.tsx | requestAnimationFrame 누수 (의존성 과다) | isPaused/isCrossActive/pauseResumeCountdown ref 미러링 | 해결 |
| 7 | GameCanvas.tsx | BGM Audio 메모리 누수 | removeAttribute('src') + load() 패턴 | 해결 |
| 8 | RankingBoard.tsx | useEffect 의존성 오류 (bgmVolume 변경마다 재실행) | 3개 useEffect로 분리 | 해결 |
| 9 | App.tsx | RankingBoard에 isBgmMuted prop 미전달 | prop 추가 | 해결 |
| 10 | RankingBoard.tsx | BGM cleanup 미흡 | removeAttribute + load 패턴 적용 | 해결 |

#### Medium (6건 해결)
| # | 파일 | 문제 | 수정 내용 | 상태 |
|---|------|------|-----------|------|
| 11 | GameCanvas.tsx | SFX Audio 메모리 누수 | ended 이벤트 리스너 추가 | 해결 |
| 12 | GameCanvas.tsx | 미사용 tick 상태로 불필요한 리렌더링 | tick/setTick 완전 제거 | 해결 |
| 13 | InstagramGate.tsx | PC 클릭 시 사운드 미재생 | isMobile 조건 제거 | 해결 |
| 14 | supabase.ts | localStorage 에러 처리 부재 | try-catch 추가 | 해결 |
| 15 | RankingBoard.tsx | BGM에 isBgmMuted 미반영 | 조건부 볼륨 처리 | 해결 |
| 16 | AdminPanel | getAllScoresForAdmin 미정렬 | sort 추가 | 해결 |

#### Low (3건 해결)
| # | 파일 | 문제 | 수정 내용 | 상태 |
|---|------|------|-----------|------|
| 17 | supabase.ts | deprecated substr() 사용 | substring()으로 변경 | 해결 |
| 18 | constants.tsx | HIT3/BREAK가 HIT1과 동일 파일 | TODO 주석 추가 | 해결(표시) |
| 19 | GameCanvas.tsx | RAINBOW 공 속도 불균일 (0.9x/1.1x) | 동일 속도로 통일 | 해결 |

---

### 1.2 미해결 (잔여 이슈)

#### High
| # | 파일 | 문제 | 비고 |
|---|------|------|------|
| 20 | GameCanvas.tsx | iOS BGM 자동재생 정책 미대응 | play()가 useEffect 내에서 호출 |
| 21 | GameCanvas.tsx | DOM 벽돌 렌더링 성능 (특수 벽돌) | 모바일 프레임 드롭 가능 |
| 22 | AdminPanel.tsx | 관리자 비밀번호 클라이언트 하드코딩 | 보안 위험 |
| 23 | index.html | Tailwind CSS CDN 사용 (프로덕션 부적합) | 빌드 최적화 필요 |
| 24 | index.html | CSP 부재 | XSS 취약 |
| 25 | constants.tsx | KAKAO_JS_KEY 소스 하드코딩 | 환경변수 이전 필요 |
| 26 | RankingBoard.tsx | BGM 중복 재생 가능성 (GameCanvas와 동시) | 상태 통합 관리 필요 |

#### Medium
| # | 파일 | 문제 | 비고 |
|---|------|------|------|
| 27 | GameCanvas.tsx | touchStart 이벤트 미처리 | 첫 터치 반응 지연 |
| 28 | GameCanvas.tsx | BOMB 연쇄 폭발 재귀 깊이 무제한 | 대량 BOMB 시 스택 오버플로우 |
| 29 | GameCanvas.tsx | SFX 중복 재생 (동시 다중 효과음) | 오디오 풀링 필요 |
| 30 | GameCanvas.tsx | CROSS 효과 중 setTimeout 체인 | Promise/async 리팩토링 권장 |
| 31 | GameCanvas.tsx | Canvas+DOM 렌더링 혼합 | z-index 충돌 가능 |
| 32 | supabase.ts | LocalStorage Race Condition | 다중 탭 데이터 손실 |
| 33 | LoginScreen.tsx | 닉네임 유효성 검증 부족 | 특수문자, 최소길이 등 |
| 34 | index.html | importmap과 Vite 충돌 가능성 | ESM 경로 설정 검토 필요 |
| 35 | RankingBoard.tsx | 카카오 공유 이미지 URL (localhost) | 프로덕션 URL 필요 |
| 36 | index.html | Galmuri 폰트 @latest 사용 | 버전 고정 권장 |

#### Low
| # | 파일 | 문제 | 비고 |
|---|------|------|------|
| 37 | constants.tsx | 맵 패턴 일부 하드코딩 | BRICK_ROWS/COLS 변경 시 깨짐 |
| 38 | constants.tsx | 로고 리소스 경로 중복 | 4개 상수가 같은 파일 참조 |
| 39 | GameCanvas.tsx | 이미지 로드 상태 미추적 | 느린 네트워크에서 폴백 색상 |
| 40 | AdminPanel.tsx | 데이터 삭제 이중 확인 부재 | 실수 삭제 방지 |

---

## 2. 수정 상세 내역

### 2.1 GameCanvas.tsx

#### 공 속도 상수 통일
- **변경 전**: `speedRef.current = 4 + (level - 1) * 0.15`
- **변경 후**: `speedRef.current = GAME_CONFIG.INITIAL_BALL_SPEED + (lvl - 1) * 0.15`
- **이유**: constants.tsx의 INITIAL_BALL_SPEED(3.6)와 불일치

#### 레벨업 비동기 state 해결
- **변경 전**: `resetGame(keepScore)` - 클로저의 level 캡처
- **변경 후**: `resetGame(keepScore, lvlOverride?)` - 두 번째 매개변수로 최신 level 전달
- **이유**: setLevel()은 비동기, resetGame 호출 시 이전 level 사용

#### RAINBOW 공 복제 수정
- **변경 전**: `dy: -sourceBall.dy * 1.1` (dy 음수 → 양수 = 아래)
- **변경 후**: `dy: -Math.abs(sourceBall.dy)` (항상 위로)
- **이유**: dy가 음수(위)인 경우 반전하면 양수(아래)가 됨

#### 패들 충돌 dy 보장
- **추가**: `ball.dy = -Math.abs(ball.dy)`
- **이유**: dx만 재계산하고 dy를 명시 설정하지 않았음

#### 충돌 감지 방어
- **추가**: `if (minO <= 0) continue`
- **이유**: 코너 깊숙이 침투 시 minO 음수로 잘못된 반사

#### tick 상태 제거
- 선언: `const [tick, setTick] = useState(0)` 제거
- 호출: `setTick(t => t + 1)` 3곳 제거
- **이유**: 어디서도 읽히지 않는 상태, 매 충돌마다 불필요한 리렌더링

#### RAF ref 미러링
- `isPausedRef`, `isCrossActiveRef`, `pauseResumeCountdownRef` 추가
- draw useEffect 의존성에서 해당 state 제거
- **이유**: state 변경마다 RAF 루프 재생성 방지

#### BGM Audio 정리
- `removeAttribute('src')` + `load()` + `null` 패턴 적용
- randomizeBGM 및 cleanup 모두 적용
- **이유**: src="" 만으로는 브라우저에 따라 리소스 미해제

#### SFX Audio 정리
- `ended` 이벤트 리스너: `removeAttribute('src')` + `load()`
- **이유**: 매번 new Audio() 생성 후 정리 없음

### 2.2 RankingBoard.tsx
- useEffect 1개 → 3개 분리 (데이터/BGM/볼륨)
- Props에 isBgmMuted 추가 + 볼륨 조건 반영
- BGM cleanup 강화

### 2.3 App.tsx
- RankingBoard에 isBgmMuted={isBgmMuted} prop 추가

### 2.4 InstagramGate.tsx
- `if (type === 'click' && isMobile)` → `if (type === 'click')`

### 2.5 supabase.ts
- substr(2, 9) → substring(2, 11)
- localStorage.setItem에 try-catch 3곳 추가
- getAllScoresForAdmin에 sort 추가

### 2.6 constants.tsx
- HIT3, BREAK에 TODO 주석 추가

---

## 3. 모바일 vs PC 분석

### 공통 (정상)
- 캔버스 좌표 변환: 스케일 팩터 적용으로 정확
- 뷰포트/줌/스크롤 방지: touch-none, user-scalable=no
- 레이아웃: aspect-[9/16] 레터박스

### 모바일 전용 문제 (미해결)
- iOS BGM 자동재생 정책 미대응 (높음)
- DOM 벽돌 렌더링 성능 (높음)
- touchStart 미처리 (중간)
- 다중 터치 오류 (중간)
- iOS 오버스크롤 바운스 (낮음)

---

## 4. 권장 후속 작업

### 즉시 (프로덕션 배포 전)
1. iOS BGM 자동재생 → 첫 사용자 상호작용에서 AudioContext unlock
2. Tailwind CSS CDN → 빌드 도구 통합
3. 환경변수 시스템 구축 (KAKAO_JS_KEY, ADMIN_SECRET)
4. CSP 메타 태그 추가

### 단기 (1-2주)
5. 특수 벽돌 Canvas 통합 렌더링
6. touchStart 이벤트 추가
7. BOMB 연쇄 폭발 깊이 제한
8. Audio 풀링 시스템

### 중기 (1개월)
9. Supabase 실제 연동 (LocalStorage 탈피)
10. 서버사이드 관리자 인증
11. 카카오 공유 프로덕션 URL 설정
