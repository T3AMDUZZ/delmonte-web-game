# 배포 가이드 - GitHub Pages + Cloudflare

## 1. GitHub Pages 설정

### 자동 배포 (GitHub Actions)
- main 브랜치에 push하면 자동으로 빌드 및 배포됨
- 워크플로우 파일: `.github/workflows/deploy.yml`

### GitHub Pages 활성화 방법
1. GitHub 레포 → Settings → Pages
2. Source: **GitHub Actions** 선택
3. 저장 후 main에 push하면 자동 배포 시작
4. 배포 완료 후 URL: `https://t3amduzz.github.io/delmonte-web-game/`

## 2. Cloudflare 설정

### 방법 A: Cloudflare를 CDN/DNS로 사용 (GitHub Pages + 커스텀 도메인)

#### 2-1. 커스텀 도메인 준비
- Cloudflare에 도메인 등록/이전
- DNS 관리 페이지에서 다음 레코드 추가:
  - CNAME: `게임도메인.com` → `t3amduzz.github.io`
  - 또는 A 레코드:
    - `185.199.108.153`
    - `185.199.109.153`
    - `185.199.110.153`
    - `185.199.111.153`

#### 2-2. GitHub Pages 커스텀 도메인 설정
1. GitHub 레포 → Settings → Pages → Custom domain
2. 커스텀 도메인 입력 (예: game.delmonte.co.kr)
3. "Enforce HTTPS" 체크

#### 2-3. Cloudflare SSL 설정
- SSL/TLS → Full (strict) 모드 설정
- Edge Certificates → Always Use HTTPS 활성화

#### 2-4. Cloudflare 캐싱 설정
- Caching → Configuration → Browser Cache TTL: 4시간
- Page Rules 추가:
  - `게임도메인.com/assets/*` → Cache Level: Cache Everything, Edge Cache TTL: 1 month

### 방법 B: Cloudflare Pages 직접 사용 (GitHub Pages 대신)

#### 2-1. Cloudflare Pages 프로젝트 생성
1. Cloudflare 대시보드 → Pages → Create a project
2. "Connect to Git" → GitHub 계정 연결
3. T3AMDUZZ/delmonte-web-game 레포 선택

#### 2-2. 빌드 설정
- Framework preset: None
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node.js version: 20

#### 2-3. 환경 변수 (필요 시)
- `NODE_VERSION`: `20`

#### 2-4. 배포
- 저장하면 자동 빌드 및 배포 시작
- 배포 URL: `delmonte-web-game.pages.dev` (자동 생성)
- 커스텀 도메인 연결 가능

### 방법 A vs B 비교

| 항목 | 방법 A (GitHub Pages + Cloudflare CDN) | 방법 B (Cloudflare Pages) |
|------|---------------------------------------|---------------------------|
| 호스팅 | GitHub Pages | Cloudflare Pages |
| CDN | Cloudflare | Cloudflare (기본 포함) |
| 빌드 | GitHub Actions | Cloudflare 자체 빌드 |
| SSL | Cloudflare 관리 | 자동 (무료) |
| 커스텀 도메인 | 설정 필요 | 간편 연결 |
| 무료 한도 | 무제한 | 월 500회 빌드, 무제한 대역폭 |
| 권장 | 기존 GitHub 워크플로우 유지 시 | 간편한 배포 원할 때 |

## 3. 배포 후 확인사항

- [ ] 게임이 정상 로딩되는지 확인
- [ ] 이미지/사운드 리소스가 정상 로딩되는지 확인
- [ ] 카카오 SDK가 정상 동작하는지 확인 (도메인 등록 필요)
- [ ] 인스타그램 링크가 정상 동작하는지 확인
- [ ] 모바일에서 정상 동작하는지 확인
- [ ] HTTPS가 정상 적용되는지 확인

## 4. 카카오 SDK 도메인 등록
- https://developers.kakao.com → 내 애플리케이션 → 앱 설정
- 플랫폼 → Web → 사이트 도메인에 배포 URL 추가
- 예: `https://게임도메인.com` 또는 `https://t3amduzz.github.io`

## 5. 트러블슈팅

### 리소스 404 에러
- vite.config.ts의 `base` 옵션 확인
- 상대 경로(`./`) vs 절대 경로(`/`) 확인

### CORS 에러
- Cloudflare Workers로 CORS 헤더 추가 가능
- 또는 리소스를 같은 도메인에서 서빙

### 카카오 공유 안 됨
- 카카오 개발자 콘솔에서 도메인 등록 필수
- KAKAO_JS_KEY가 해당 도메인에서 허용되는지 확인
