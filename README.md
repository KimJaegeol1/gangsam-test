# 강쌤과외 수업 보고서 시스템

수업이 끝나면 선생님이 수업 보고서를 쓰고, 학생은 자기 보고서와 누적 수업 완료 횟수를 보는 시스템이다.

| 폴더·파일 | 내용 |
|---|---|
| `frontend/` | 화면. Next.js 16 (App Router, TypeScript) |
| `backend/` | API. FastAPI, psycopg 3, JWT |
| `db/` | `schema.sql`(테이블), `seed.sql`(테스트 데이터), `README.md`(DB 설계 문서) |
| `API.md` | API 명세 |

과제 제출 형식(`/frontend`, `/db`)에 API 서버인 `/backend`를 더했다. 화면은 `/api/...`만 부르고, `frontend/next.config.ts`의 rewrites가 이 요청을 FastAPI로 넘긴다.

## 1. 프로젝트 실행 방법

준비물: PostgreSQL, Python 3.10 이상, Node.js 20.9 이상

DB는 Supabase 대신 로컬 PostgreSQL을 썼다(과제에서 허용).

### DB

프로젝트 루트에서 실행한다.

```bash
createdb kangsam
psql kangsam -f db/schema.sql
psql kangsam -f db/seed.sql
```

`seed.sql`을 다시 실행하면 테스트 데이터가 처음 상태로 돌아간다.

### 백엔드 (터미널 1)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`backend/.env` 파일을 만든다.

```
DATABASE_URL=postgresql://<DB 사용자>@localhost:5432/kangsam
JWT_SECRET=<임의의 긴 문자열>
```

- DB 비밀번호가 있으면 `postgresql://<DB 사용자>:<비밀번호>@localhost:5432/kangsam`으로 쓴다.
- `JWT_SECRET`은 `openssl rand -base64 32`로 만들 수 있다.

```bash
fastapi dev main.py
```

`http://127.0.0.1:8000`에서 실행된다. API 문서는 `http://127.0.0.1:8000/docs`에서 볼 수 있다.

### 프론트엔드 (터미널 2)

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:3000`으로 접속한다.

### 테스트 계정

로그인은 이름과 전화번호(하이픈 없이 숫자만)로 한다.

| 구분 | 이름 | 전화번호 | 설명 |
|---|---|---|---|
| 선생님 | 김주 | 01011110001 | 수업 1, 3, 4의 주 선생님 |
| 선생님 | 이보조 | 01011110002 | 수업 1, 4의 보조 선생님 |
| 선생님 | 박온택 | 01011110003 | `is_ontact`가 true. 수업 2(온택트), 수업 5(정규)의 주 선생님 |
| 학생 | 홍길동 | 01099990000 | |
| 학생 | 홍길순 | 01099990000 | 홍길동과 같은 번호 (형제가 부모님 번호를 같이 쓰는 경우) |

수업 4는 아직 보고서가 없어서 김주, 이보조로 보고서 작성을 해볼 수 있다.

### 화면

| 주소 | 화면 |
|---|---|
| `/` | 시작 화면 (선생님 로그인, 학생 로그인 링크) |
| `/teacher/login` | 선생님 로그인 |
| `/teacher/report` | 보고서 작성 |
| `/student/login` | 학생 로그인 |
| `/student/reports` | 보고서 목록과 누적 수업 완료 횟수 |
| `/student/reports/[lessonId]` | 보고서 상세 |

로그인 정보는 브라우저 탭의 sessionStorage에 저장된다. 새 탭에서는 다시 로그인해야 한다.

## 2. 테이블 구조

`lesson`은 수업 1회다. 한 수업에 주 선생님 1명과 보충 선생님 여러 명이 참여할 수 있어서, 한 수업에 보고서가 여러 개 달릴 수 있다. 보충 선생님은 코드와 DB에서 보조 선생님(assistant)이라고 부른다.

| 테이블 | 컬럼 | 설명 |
|---|---|---|
| `teacher` | id, name, phone, is_ontact | 선생님. `is_ontact`가 true면 온택트 수업도 맡을 수 있다. |
| `student` | id, name, phone | 학생 |
| `lesson` | id, student_id, main_teacher_id, lesson_type, started_at, ended_at | 수업 1회. `lesson_type`은 `regular`(정규) 또는 `ontact`(온택트) |
| `lesson_assistant` | id, lesson_id, teacher_id | 수업별 보조 선생님. 보조 선생님 한 명당 한 행 |
| `report` | id, lesson_id, teacher_id, report_content, homework_content | 수업 보고서. 숙제가 없으면 `homework_content`는 NULL |

주요 제약

- `teacher`, `student`: `UNIQUE (name, phone)`. 로그인 기준과 같다. 형제가 부모님 번호를 같이 쓰는 경우를 고려해 전화번호만으로는 묶지 않았다.
- `lesson_assistant`: `UNIQUE (lesson_id, teacher_id)`. 같은 수업에 같은 보조 선생님이 두 번 들어가지 않는다.
- `report`: `UNIQUE (lesson_id, teacher_id)`. 한 선생님은 한 수업에 보고서를 하나만 쓴다.
- `phone`은 숫자만 들어간다(CHECK). `lesson`은 `ended_at > started_at`(CHECK)이다.

과제의 필수 컬럼에서 바꾼 점

| 변경 | 이유 |
|---|---|
| `lesson_type`을 report에서 lesson으로 옮김 | 수업 종류는 보고서가 아니라 수업의 값이다. 보고서마다 두면 같은 수업의 보고서끼리 종류가 달라질 수 있다. |
| `started_at`, `ended_at`을 report에서 lesson으로 옮김 | lesson이 수업 1회이므로 시간도 수업의 값이다. |
| `lesson_assistant` 추가 | 보충 선생님과 수업의 관계(N:M)를 별도 테이블로 나눴다. 과제의 선택 구현 항목이다. |

ERD, 컬럼별 제약, 여러 테이블에 걸친 규칙을 어디서 지키는지는 [`db/README.md`](db/README.md)에 있다.

## 3. 수업 완료 횟수 계산 방식

정규 수업에서 그 수업의 주 선생님이 쓴 보고서만 +1로 센다.

| 보고서를 쓴 선생님 | 정규 수업 | 온택트 수업 |
|---|---|---|
| 주 선생님 | +1 | +0 |
| 보조(보충) 선생님 | +0 | 해당 없음 (온택트 수업에는 보조 선생님이 없다고 가정) |

```sql
SELECT COUNT(*) AS completed_count
FROM report r
JOIN lesson l ON l.id = r.lesson_id
WHERE l.student_id = :student_id          -- 조회할 학생
  AND l.lesson_type = 'regular'           -- 정규 수업만
  AND r.teacher_id = l.main_teacher_id;   -- 주 선생님이 쓴 보고서만
```

- `backend/main.py`의 `GET /api/students/me/reports`에서 이 쿼리로 계산한다.
- `report`의 `UNIQUE (lesson_id, teacher_id)` 때문에 한 수업은 많아야 1회로 센다.
- 횟수를 컬럼에 저장하지 않고 조회할 때마다 계산한다. 보고서가 추가되거나 수업 종류가 바뀌어도 따로 맞출 값이 없다.

seed 데이터로 보면 이렇다.

| 수업 | 학생 | 종류 | 보고서 | 횟수 |
|---|---|---|---|---|
| 1 | 홍길동 | 정규 | 김주(주), 이보조(보조) | +1 |
| 2 | 홍길동 | 온택트 | 박온택(주) | +0 |
| 3 | 홍길동 | 정규 | 김주(주) | +1 |
| 4 | 홍길동 | 정규 | 없음 | +0 |
| 5 | 홍길순 | 정규 | 박온택(주) | +1 |

홍길동은 2회, 홍길순은 1회다. 김주로 수업 4의 보고서를 쓰면 홍길동은 3회가 된다.

## 4. 요구사항 해석

- 주 선생님과 보충 선생님은 수업마다 정해지는 역할이다. 주 선생님은 `lesson.main_teacher_id`, 보충 선생님은 `lesson_assistant`에 넣는다.
- 온택트 선생님은 `is_ontact`가 true인 선생님이다. 온택트·정규 수업을 모두 맡을 수 있고, false인 선생님은 정규 수업만 맡는다. 온택트 수업에는 보충 선생님이 없다고 가정한다.
- 보고서 작성 페이지의 요구사항은 이렇게 구현했다.
  - 수업 선택: 로그인한 선생님이 주 선생님이거나 보조 선생님인 수업만 고를 수 있다.
  - 작성 선생님 선택 또는 지정: 로그인한 선생님으로 지정하고, 화면에서 바꿀 수 없다.
  - 수업 종류 선택: 수업 종류는 수업을 만들 때 정해지는 값이라, 수업을 고르면 채워지고 보고서에서는 바꿀 수 없다.
  - 수업 시작/종료 시간 입력: 수업을 고르면 수업 시간이 채워진다. 주 선생님이 고치면 수업에 반영되고, 보조 선생님에게는 잠근다.
- 학생 보고서 조회 페이지는 수업 단위로 보여준다. 한 수업에 보고서가 여러 개면 목록에서는 한 줄에 선생님 이름을 같이 보여주고, 상세에서는 보고서마다 카드로 보여준다.

자세한 내용은 [`db/README.md`](db/README.md)의 1번에 있다.

## 5. API

| # | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 1 | POST | `/api/teachers/login` | 선생님 로그인 (토큰 발급) |
| 2 | POST | `/api/students/login` | 학생 로그인 (토큰 발급) |
| 3 | GET | `/api/teachers/me/lessons` | 보고서를 쓸 수업 목록 |
| 4 | POST | `/api/reports` | 보고서 등록 |
| 5 | GET | `/api/students/me/reports` | 보고서 목록과 누적 수업 완료 횟수 |

요청, 응답, 에러 코드는 [`API.md`](API.md)에 있다.

## 6. 구현 범위와 개선 방향

필수 구현 4가지(DB 구조, 보고서 작성 페이지, 학생 보고서 조회 페이지, 수업 완료 횟수 계산 로직)를 구현했다. 선택 구현 항목 중에서는 두 가지를 넣었다.

- 보충 선생님과 수업의 관계를 별도 테이블(`lesson_assistant`)로 설계했다.
- 역할별 접근 제어: 로그인하면 역할(선생님/학생)이 담긴 JWT를 발급하고, 선생님 API와 학생 API를 역할로 나눈다. 학생은 자기 보고서만 볼 수 있다.

선생님, 학생, 수업 등록은 필수 구현 항목에 없어서 화면과 API 없이 `seed.sql`로 넣는다.

개선 방향

- 선생님, 학생, 수업 등록 기능. 이때 [`db/README.md`](db/README.md) 5번의 규칙(온택트 수업의 주 선생님은 `is_ontact`가 true, 보조 선생님은 정규 수업에만 등)을 저장 코드에서 확인한다.
- 토큰 만료 시간과 로그아웃. 지금은 토큰에 만료가 없고, 탭을 닫으면 sessionStorage에서 지워지는 것으로 대신한다.
- 한 수업에 보고서가 여러 개일 때 LLM으로 합친 요약을 학생에게 보여주기.
- 보고서 상세 API. 지금은 상세 화면이 5번 API를 다시 불러서 해당 수업을 찾는다.
