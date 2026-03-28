# CultureBox2 앱 구조 상세 분석

## 1) 한 줄 요약
이 앱은 **Vite + React + TypeScript + Tailwind(shadcn-ui) 기반의 SPA**이며, 프런트엔드 상태는 `AppContext`와 로컬 상태로 관리하고, 데이터 백엔드는 **Google Apps Script(GAS) 웹앱**을 `GET` 요청으로 호출하는 구조다.

---

## 2) 런타임 부트스트랩/앱 셸

### 엔트리와 전역 Provider 체인
- `src/main.tsx`
  - `createRoot(...).render(<App />)`로 단순 부트스트랩.
- `src/App.tsx`
  - 전역 Provider 체인:
    1. `QueryClientProvider` (react-query)
    2. `TooltipProvider`
    3. `BrowserRouter` (`basename={import.meta.env.BASE_URL}`)
    4. `AppProvider` (앱 전역 상태)
  - 라우트 레이아웃:
    - 상단 `Navbar`, 중간 `Routes`, 하단 `Footer`, 전역 `Toaster`.

### URL 정규화 + 보호 라우트
- `AppContent` 내부에서:
  - **중복 슬래시/후행 슬래시 제거** 로직으로 URL normalize.
  - 보호 경로 `['/explore', '/create', '/myboxes']`는 `user`/`isAdmin` 없으면:
    - `pendingPath` 저장
    - 로그인 모달 오픈
    - 홈(`/`)으로 리다이렉트
  - 로그인 성공 후 `pendingPath`로 복귀.

---

## 3) 전역 상태(AppContext) 설계

`src/contexts/AppContext.tsx`가 사실상 앱의 핵심 상태 허브.

### 전역 상태 항목
- `lang`: 다국어 코드 (`ko|en|ja`)
- `user`: 학생/교사 로그인 사용자
- `isAdmin`: 관리자 세션 플래그
- `schools`: 학교 목록 캐시
- `theme`: UI 테마 (`default|blue|green|pink`)

### 영속화(LocalStorage)
- `dcb_lang`, `dcb_user`, `dcb_admin_session`, `dcb_theme` 키 사용.
- 앱 시작 시 hydrate, 변경 시 동기 저장.

### 사이드이펙트
- 초기 마운트에서 `API.getSchools()` 호출해 학교 목록 로딩.
- `theme` 변경 시 `body` 클래스에 `theme-*` 적용.

### 인증 관점 특이점
- 학생/교사 로그인은 **서버 세션이 아닌 클라이언트 로컬 상태**.
- 관리자 로그인도 `localStorage` 기반 세션 플래그.
- 즉 현재 인증은 **UI 접근 통제 수준**으로 보이며, 보안이 강한 서버 인증 구조는 아님.

---

## 4) 데이터 계층(API) 구조

`src/lib/api.ts`가 타입 + API 호출 + 헬퍼를 담당.

### 도메인 타입
- `School`, `Box`, `Item`, `Message`, `Reaction`, `User` 정의.
- 박스 상태값: `draft | packed | sent | arrived | opened`.

### API 통신 핵심
- `GAS_URL` 하나로 모든 액션 호출.
- `fetchGAS(action, params)`가 내부 공통 함수:
  - 쿼리스트링 기반 `GET` 호출
  - 객체 파라미터 JSON 문자열화
  - 2000자 초과 값은 URL 길이 제한 때문에 skip

### 파일 업로드 전략
- DataURL을 직접 GET에 실을 수 없어서
  1) `uploadFileInit`
  2) `uploadFileChunk` (1500 chars 청크)
  3) `uploadFileFinalize`
  순서로 업로드.
- 이 패턴은 `CreateBox`, `BoxDetail(메시지 첨부)`에서 재사용.

### 번역/표시 헬퍼
- `getSchoolName`, `getBoxTitle`, `getBoxDesc`, `getItemTitle`
- 다국어 필드 fallback 처리를 공통화.

---

## 5) 라우팅/페이지 책임 분리

### `Home`
- 통계(`getStats`) + 최근 박스(`getBoxes`) 로딩.
- 비로그인 시 로그인 CTA, 로그인 시 Explore/Create CTA.

### `Explore`
- 필터(`all/sent/opened`) + 검색어로 박스 조회.
- 일반 사용자는 자신의 학교 관련 박스만 클라이언트 필터링.
- 관리자(`isAdmin`)는 전체 조회.

### `CreateBox`
- 4단계 wizard:
  1) 기본정보
  2) 아이템 추가
  3) 포장 연출
  4) 발송
- 발송 시:
  - `createBox` → (아이템 반복 `addItem`, 필요 시 파일 업로드) → `sendBox`
- 진행률(progress) UI 포함.

### `BoxDetail`
- 박스/아이템/메시지 로딩.
- 미개봉 상태면 **언박싱 인터랙션**(테이프 제거 → 개봉).
- 탭 구성:
  - `items`: 타입별 렌더링 + 상세 모달
  - `messages`: 댓글 작성/첨부/피드
- 메시지 첨부 파일도 DataURL이면 Drive 업로드 후 URL 저장.

### `MyBoxes`
- `getBoxes({ school_id })` 후 `created_by === user.id` 필터링.

### `Admin`
- 탭형 관리 콘솔:
  - 학교/박스/사용자/메시지 CRUD
- 다이얼로그 폼 컴포넌트 내장 (`SchoolForm`, `BoxForm`, `UserForm`)
- 전체 박스의 메시지를 순회 수집해서 관리 가능.

---

## 6) 컴포넌트 계층

### 앱 특화 컴포넌트
- `Navbar`: 네비게이션, 언어/테마 선택, 로그인 상태 표시, 모바일 메뉴.
- `LoginModal`: 학생/교사 로그인 (참여코드 검증).
- `AdminLoginModal`: 하드코딩된 관리자 인증 로직.
- `BoxCard`: 박스 리스트 카드 프레젠테이션.
- `ItemDetailModal`: 아이템 타입별 상세 표현(YouTube/PDF/링크 포함).
- `Footer`: 외부 링크 크레딧.

### UI 베이스 레이어
- `src/components/ui/*`: shadcn/radix 기반 재사용 UI.
- 실제 도메인 기능은 주로 페이지 + 앱 특화 컴포넌트에 집중.

---

## 7) i18n/테마 시스템

### i18n
- `src/lib/i18n.ts`에 사전 기반 문자열 맵(`ko/en/ja`).
- `t(key, lang)` 단순 조회 + 한국어 fallback.
- 런타임 번역 라이브러리 없이 경량 구현.

### 테마
- `src/index.css`에서 CSS 변수 중심 토큰 설계.
- `.theme-blue/.theme-green/.theme-pink`로 primary/hero 계열 토큰 오버라이드.
- `AppContext`가 `body`에 테마 클래스 적용.

---

## 8) 기술 스택/빌드/테스트

### 빌드 & 런타임
- Vite + React SWC 플러그인.
- `vite.config.ts`의 `base`:
  - prod: `/culturebox2/`
  - dev: `/`
- alias `@ -> ./src`.

### 테스트
- Vitest 기본 템플릿 테스트 1개 존재(`example.test.ts`).
- 현재 구조상 단위/통합 테스트 커버리지는 매우 낮은 편.

---

## 9) 아키텍처 상 강점

1. **빠른 MVP 구현 적합성**
   - 단일 API 게이트웨이 + 단순 전역상태로 개발 속도 빠름.
2. **도메인 모델 명확성**
   - `Box/Item/Message/School` 타입 분리가 잘 되어 있음.
3. **사용자 경험 포인트**
   - 언박싱 애니메이션, 단계형 생성 플로우 등 UX 요소가 뚜렷.
4. **다국어/테마 내장**
   - 다국어/브랜딩 확장에 유리.

---

## 10) 구조적 리스크/개선 포인트

1. **보안/인증 취약**
   - 관리자 자격 정보가 프런트에 존재.
   - 사용자/관리자 인증이 클라이언트 저장소 기반.
2. **데이터 접근 제어 한계**
   - 클라이언트 필터 중심 접근 제어는 우회 가능.
   - 서버 측 권한 검증 계층 필요.
3. **GAS GET 의존성**
   - URL 길이 제한으로 대용량/복잡 payload 취급 어려움.
   - chunk upload로 우회하지만 구조적으로 비효율 가능.
4. **React Query 활용 미흡**
   - 도입되어 있으나 대부분 `useEffect + useState` 직접 패턴.
   - 캐시/무효화/에러 상태 표준화 기회 큼.
5. **테스트 부족**
   - 핵심 플로우(Create/Detail/Admin)에 대한 자동 테스트 부재.

---

## 11) 권장 리팩터링 로드맵 (우선순위)

### P0 (보안/안정성)
- 관리자 인증 로직을 서버 측으로 이전.
- API 액션별 권한 검증(학교/사용자/관리자) 백엔드 강제.
- 민감 환경값/시크릿 클라이언트 제거.

### P1 (구조 개선)
- 페이지 데이터 fetching을 React Query `useQuery/useMutation`로 통합.
- `services/` 레이어 도입:
  - API primitive (`fetchGAS`)와 도메인 usecase 분리.
- 타입 안전성 강화 (`any` 제거, zod 등 런타임 검증).

### P2 (유지보수성)
- Admin 대형 파일 분할 (tab 별 컴포넌트, form 분리).
- i18n 키/사전 자동 검증 스크립트 추가.
- 테스트 확장:
  - smoke: 라우팅/권한
  - 핵심: 생성 플로우, 언박싱, 메시지 업로드.

---

## 12) 현재 구조 다이어그램 (텍스트)

```text
main.tsx
  └─ App.tsx
      ├─ QueryClientProvider
      ├─ TooltipProvider
      ├─ BrowserRouter
      └─ AppProvider (global app state)
          └─ AppContent
              ├─ Navbar
              ├─ Routes
              │   ├─ /
              │   ├─ /explore
              │   ├─ /box/:id
              │   ├─ /create
              │   ├─ /myboxes
              │   └─ /admin
              ├─ Footer
              ├─ LoginModal
              └─ AdminLoginModal

Pages / Components
  └─ API layer (lib/api.ts) -> GAS URL (action-based GET)
```

---

## 13) 결론
이 프로젝트는 **교육/문화교류 시나리오용 인터랙티브 SPA로서 MVP 완성도는 높은 편**이다. 다만 운영 단계로 확장하려면, 특히 **인증/권한을 서버 중심으로 재설계**하고, 데이터 fetching과 테스트 체계를 정규화하는 것이 핵심이다.
