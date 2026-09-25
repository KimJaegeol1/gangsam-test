-- 강쌤과외 수업 보고서 시스템 DB 스키마 (PostgreSQL)
-- 설계 기준과 규칙 설명은 db/README.md 참고
-- 다시 실행하면 테이블을 지우고 새로 만든다.

SET client_min_messages = warning;  -- 처음 실행할 때 나오는 '테이블 없음' 안내 문구를 숨긴다

DROP TABLE IF EXISTS report, lesson_assistant, lesson, student, teacher;

-- 선생님
CREATE TABLE teacher (
  id         bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text    NOT NULL,
  phone      text    NOT NULL CHECK (phone ~ '^[0-9]+$'),  -- 하이픈 없이 숫자만
  is_ontact  boolean NOT NULL DEFAULT false,                -- true: 온택트·정규 모두 가능, false: 정규만 가능
  UNIQUE (name, phone)                                      -- 로그인 기준(이름 + 전화번호)
);

-- 학생
CREATE TABLE student (
  id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name   text   NOT NULL,
  phone  text   NOT NULL CHECK (phone ~ '^[0-9]+$'),        -- 하이픈 없이 숫자만
  UNIQUE (name, phone)                                      -- 부모님 번호를 동시에 사용하는 경우를 고려
);

-- 수업 1회
CREATE TABLE lesson (
  id               bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id       bigint      NOT NULL REFERENCES student (id),
  main_teacher_id  bigint      NOT NULL REFERENCES teacher (id),  -- 주 선생님 (수업당 1명)
  lesson_type      text        NOT NULL CHECK (lesson_type IN ('regular', 'ontact')),  -- 정규 / 온택트
  started_at       timestamptz NOT NULL,
  ended_at         timestamptz NOT NULL,
  CHECK (ended_at > started_at)
);

-- 수업별 보조 선생님 (보조 선생님 한 명당 한 행)
CREATE TABLE lesson_assistant (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id   bigint NOT NULL REFERENCES lesson (id) ON DELETE CASCADE,  -- 수업이 지워지면 같이 지워진다
  teacher_id  bigint NOT NULL REFERENCES teacher (id),
  UNIQUE (lesson_id, teacher_id)                             -- 같은 수업에 같은 보조 선생님 중복 방지
);

-- 수업 보고서
CREATE TABLE report (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id         bigint NOT NULL REFERENCES lesson (id),   -- 보고서가 달린 수업은 지울 수 없다
  teacher_id        bigint NOT NULL REFERENCES teacher (id),  -- 작성 선생님
  report_content    text   NOT NULL,
  homework_content  text,                                     -- 숙제가 없는 날은 NULL
  UNIQUE (lesson_id, teacher_id)                              -- 한 선생님은 한 수업에 보고서 하나
);
