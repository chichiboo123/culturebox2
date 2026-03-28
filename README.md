# Culture Box 2

학교 간 문화 교류를 위한 디지털 박스 플랫폼입니다.  
학생/교사가 문화 콘텐츠(텍스트, 이미지, 영상, 링크, PDF)를 박스에 담아 다른 학교로 보내고, 도착한 박스를 열어 메시지로 소통할 수 있습니다.

## 주요 기능

- **로그인/권한**
  - 학생/교사 로그인
  - 관리자 로그인 및 관리 패널
- **박스 흐름**
  - 박스 생성(4-step 위저드) → 포장 → 발송 → 개봉
- **콘텐츠 타입 지원**
  - text / image / video / youtube / link / pdf
- **소셜 메시지**
  - 박스별 댓글/미디어 첨부
- **다국어/테마**
  - 한국어/영어/일본어
  - 기본/블루/그린/핑크 테마

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn-ui(Radix)
- **Routing**: react-router-dom
- **Data Layer**: Google Apps Script Web App (action 기반 API)
- **State**: AppContext + React state
- **Testing**: Vitest

## 프로젝트 구조

```text
src/
  components/           # 앱 전용 UI (Navbar, LoginModal, BoxCard 등)
  components/ui/        # shadcn-ui 기반 공통 컴포넌트
  contexts/
    AppContext.tsx      # 전역 상태(언어/테마/사용자/학교)
  lib/
    api.ts              # 도메인 타입 + GAS API 호출 + 업로드 유틸
    i18n.ts             # 다국어 사전
  pages/
    Home.tsx
    Explore.tsx
    CreateBox.tsx
    BoxDetail.tsx
    MyBoxes.tsx
    Admin.tsx
  App.tsx               # Provider + Router + App Shell
  main.tsx              # 엔트리 포인트
public/
  favicon.svg
```

## 실행 방법

```bash
# 1) 의존성 설치
npm install

# 2) 개발 서버 실행
npm run dev

# 3) 테스트
npm run test

# 4) 빌드
npm run build
```

## 환경/배포 참고

- Vite `base`는 `VITE_BASE_PATH` 환경변수로 제어됩니다. (기본값: `/`)
  - 커스텀 도메인 루트 배포(예: `http://culturebox.chichiboo.link/`)는 기본값 `/` 사용
  - 서브경로 배포가 필요하면 예: `VITE_BASE_PATH=/culturebox2/`
- `BrowserRouter`는 `import.meta.env.BASE_URL`를 basename으로 사용합니다.

## 관리자 보안 설정

관리자 경로(`/admin`)는 **관리자 세션(isAdmin) 전용**이며, 로그인 시 아래 환경변수를 사용합니다.

```bash
cp .env.example .env
# .env 파일 수정
VITE_ADMIN_USERNAME=관리자아이디
VITE_ADMIN_PASSWORD=관리자비밀번호
```

> 환경변수가 설정되지 않으면 관리자 로그인이 비활성화됩니다.

### 관리자 로그인 비활성화 오류 해결

관리자 로그인 창에 `VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.`가 표시되면,
배포 환경에 아래 값을 추가한 뒤 **다시 빌드/배포**해야 합니다.

```bash
VITE_ADMIN_USERNAME=master
VITE_ADMIN_PASSWORD=원하는_강한_비밀번호
```

- 로컬 개발: 프로젝트 루트 `.env` 파일에 설정
- 배포 환경(예: Vercel/Netlify/Cloudflare): 프로젝트 환경변수에 동일하게 등록

주요 배포 서비스 입력 위치:
- **Vercel**: Project → Settings → Environment Variables
- **Netlify**: Site configuration → Environment variables
- **Cloudflare Pages**: Project → Settings → Variables and Secrets (Production/Preview 각각 설정)
- **GitHub Actions 배포**: Repository → Settings → Secrets and variables → Actions
- 등록 후 반드시 재배포(또는 재시작)

> 참고: `VITE_` 접두사의 값은 클라이언트 번들에 포함되므로, 장기적으로는 서버측 인증 API로 이전하는 것을 권장합니다.

## 아키텍처 상세 문서

자세한 구조 분석은 아래 문서를 참고하세요.

- `docs/APP_ARCHITECTURE_ANALYSIS.md`

## 앱 미리보기 이미지

- 현재 작업 환경에서는 브라우저 캡처 도구를 사용할 수 없어 첫 페이지 스크린샷을 첨부하지 못했습니다.
- 캡처 가능한 환경에서 `Home` 화면을 촬영해 본 섹션에 추가해 주세요.

