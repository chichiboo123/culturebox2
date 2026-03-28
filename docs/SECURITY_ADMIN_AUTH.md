# 관리자 인증 보안 메모

## 현재 권장 방식

관리자 인증은 프런트에서 비교하지 않고, **GAS 서버(`adminLogin`)에서 검증**합니다.

- Script Properties
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
- 로그인 성공 시 서버가 `admin_token` 발급
- 이후 관리자 API 호출마다 `admin_token` 검증

## 왜 이렇게 해야 하나?

`VITE_*` 또는 정적 파일 기반 비밀값은 클라이언트로 전달되어 노출될 수 있습니다.
운영 보안 기준에서는 비밀값 비교를 서버에서만 수행해야 합니다.

## 운영 체크

- Script Properties 설정 후 Web App 재배포
- 관리자 로그인 성공/실패 동작 확인
- 비관리자 접근 시 `/admin` 차단 확인
