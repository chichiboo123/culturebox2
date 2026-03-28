# 배포 체크리스트 (운영자용)

## 1) 관리자 인증 설정 (필수)

- Apps Script → Project Settings → Script properties
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
- Web App 재배포

## 2) 배포 경로 설정

- 커스텀 도메인 루트: `VITE_BASE_PATH` 미설정(기본 `/`)
- 서브경로 배포: `VITE_BASE_PATH=/your-subpath/`

## 3) 배포 후 점검

- `/admin` 접근 시 로그인 모달 표시
- 올바른 관리자 계정 로그인 성공
- 잘못된 관리자 계정 로그인 실패
- 일반 사용자로 `/admin` 접근 차단
- 일반 사용자로 타학교 박스 접근 차단

## 4) 보안 점검

- 관리자 비밀값은 프런트 정적 파일에 두지 않기
- 관리자 검증은 GAS 서버에서만 처리
