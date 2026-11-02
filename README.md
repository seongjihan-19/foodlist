# 상품 관리 (로컬 전용)

Supabase의 상품 DB(`docs/dummy/schema.sql` 구조)를 조회 · 검색 · 추가 · 삭제하는 React 앱.
이 컴퓨터에서만 쓰는 도구라 `127.0.0.1`에서만 열린다.

## 실행

`상품관리 실행.bat`을 더블클릭한다.

- 처음 실행할 때는 필요한 패키지를 자동으로 설치한다 (1~2분)
- 서버가 켜지면 브라우저가 자동으로 열린다 (http://127.0.0.1:5173)
- 사용을 마치려면 검은 창(명령 프롬프트)을 닫는다

## 처음 한 번: 연결 설정

브라우저에 연결 화면이 나오면 두 값을 붙여 넣고 **연결**을 누른다. 연결이 확인되면 이 브라우저에 저장돼 다음부터는 바로 목록이 열린다.

| 값 | Supabase 대시보드에서 찾는 곳 |
|---|---|
| Project URL | Project Settings → Data API (`https://...supabase.co`) |
| service_role 키 | Project Settings → API Keys → Legacy API keys 탭 → service_role 옆 Reveal (eyJ로 시작) |

- DB에 테이블이 없으면 먼저 Supabase SQL Editor에서 `docs/dummy/schema.sql` → `docs/dummy/seed.sql`을 실행한다
- 다른 프로젝트로 바꾸려면 화면 오른쪽 위 **연결 해제**를 누르고 다시 입력한다

### 선택: `.env.local`로 설정

`.env.local`에 아래 값을 적어 두면 연결 화면 없이 그 값을 쓴다 (이때는 연결 해제 버튼이 나오지 않음). 고친 뒤에는 앱을 다시 실행한다.

| 변수 | 값 | 용도 |
|---|---|---|
| `VITE_SUPABASE_URL` | Project URL | 필수 |
| `VITE_SUPABASE_ANON_KEY` | Legacy 탭의 anon public 키 | 조회 |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Legacy 탭의 service_role 키 | 추가 · 삭제 |

- service_role 키를 비우면 **읽기 전용**으로 열린다 (추가 · 삭제 버튼 없음)
- anon 키를 비우면 조회도 service_role 키로 한다
- Session pooler 같은 DB 연결 문자열(`postgresql://...`)은 이 앱에서 쓰지 않는다

## Vercel 배포 (공개 · 읽기 전용)

배포된 사이트는 누구나 접속할 수 있으므로 **조회 · 검색만** 된다. 추가 · 삭제는 로컬(`상품관리 실행.bat`)에서 한다.

1. Vercel 프로젝트 → Settings → Environment Variables에 두 개만 추가
   - `VITE_SUPABASE_URL`: Project URL
   - `VITE_SUPABASE_ANON_KEY`: anon 키
2. Deployments → 최신 배포 `⋯` → Redeploy (환경 변수는 다시 빌드해야 반영됨)

- service_role 키는 Vercel에 넣지 않는다. 넣더라도 배포 빌드에는 포함되지 않게 코드에서 막아 두었다
- 배포 사이트에는 연결 입력 화면이 없다. 환경 변수가 없으면 "사이트 설정이 아직 끝나지 않았습니다" 안내만 나온다

## 기능

- 조회: 목록에서 상품을 누르면 상세 패널에 보관기간 · 안내사항 · 알레르기가 나온다
- 검색: 상품명 · 코드 · 산지 · 원재료 · 특징 · 알레르기 물질 · 안내 내용에서 찾는다. 카테고리와 알레르기 함유 표시로 거를 수 있다
- 추가: 기본 정보와 보관기간 · 안내사항 · 알레르기 행을 한 번에 입력. DB 제약과 같은 기준으로 저장 전에 검사한다
- 삭제: 상품을 지우면 하위 정보도 함께 지워진다 (되돌릴 수 없음)

## 주의

- `service_role` 키는 RLS를 무시하고 DB 전체를 읽고 쓸 수 있다. 키를 공유하지 않는다
- 화면에서 넣은 키는 이 브라우저의 저장소(localStorage)에 남는다. 다른 사람과 같이 쓰는 컴퓨터라면 사용 후 **연결 해제**를 누른다
- 새 형식 키(`sb_secret_...`, `sb_publishable_...`)는 쓸 수 없다. Legacy 탭의 service_role 키를 쓴다
- 배포 빌드(`npm run build`)에는 URL · anon 키만 들어가고 service_role 키는 들어가지 않는다
- 추가는 상품 → 하위 행 순서로 저장하고, 하위 행 저장이 실패하면 상품을 지워 되돌린다
- 목록 값(카테고리 · 보관방식 등)은 `src/constants.js`에 있다. `schema.sql`의 CHECK 제약을 바꾸면 여기도 같이 바꾼다
