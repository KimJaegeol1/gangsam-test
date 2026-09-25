from datetime import datetime

import psycopg
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from auth import create_token, get_current_student, get_current_teacher
from db import get_conn

load_dotenv()  # backend/.env 읽기

app = FastAPI(title="강쌤과외 수업 보고서 API")


# ---------- 에러 응답을 명세 형식 { "message": "..." } 로 맞춘다 ----------

@app.exception_handler(StarletteHTTPException)
async def http_error(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    # FastAPI 기본값은 422지만, 명세대로 입력값 오류는 400으로 돌려준다.
    return JSONResponse(status_code=400, content={"message": "입력값이 올바르지 않습니다."})


# ---------- 1. 선생님 로그인 ----------

class LoginRequest(BaseModel):
    name: str
    phone: str  # 하이픈 없이 숫자만. 예: 01011110001


@app.post("/api/teachers/login")
def teacher_login(body: LoginRequest):
    with get_conn() as conn:
        teacher = conn.execute(
            "SELECT id, name FROM teacher WHERE name = %s AND phone = %s",
            (body.name, body.phone),
        ).fetchone()

    if teacher is None:
        raise HTTPException(status_code=401, detail="이름 또는 전화번호가 맞지 않습니다.")

    return {"token": create_token(teacher["id"], "teacher"), "teacher": teacher}


# ---------- 2. 학생 로그인 ----------

@app.post("/api/students/login")
def student_login(body: LoginRequest):
    with get_conn() as conn:
        student = conn.execute(
            "SELECT id, name FROM student WHERE name = %s AND phone = %s",
            (body.name, body.phone),
        ).fetchone()

    if student is None:
        raise HTTPException(status_code=401, detail="이름 또는 전화번호가 맞지 않습니다.")

    return {"token": create_token(student["id"], "student"), "student": student}


# ---------- 3. 보고서를 쓸 수업 목록 ----------

@app.get("/api/teachers/me/lessons")
def my_lessons(teacher_id: int = Depends(get_current_teacher)):
    with get_conn() as conn:
        lessons = conn.execute(
            """
            SELECT l.id AS lesson_id, s.name AS student_name, l.lesson_type,
                   l.started_at, l.ended_at,
                   CASE WHEN l.main_teacher_id = %(teacher_id)s THEN 'main' ELSE 'assistant' END AS role
            FROM lesson l
            JOIN student s ON s.id = l.student_id
            WHERE l.main_teacher_id = %(teacher_id)s
               OR l.id IN (SELECT lesson_id FROM lesson_assistant WHERE teacher_id = %(teacher_id)s)
            ORDER BY l.started_at DESC
            """,
            {"teacher_id": teacher_id},
        ).fetchall()

    return lessons


# ---------- 4. 보고서 등록 ----------

class ReportRequest(BaseModel):
    lesson_id: int
    started_at: datetime
    ended_at: datetime
    report_content: str
    homework_content: str | None = None  # 숙제가 없으면 null


@app.post("/api/reports", status_code=201)
def create_report(body: ReportRequest, teacher_id: int = Depends(get_current_teacher)):
    if not body.report_content.strip():
        raise HTTPException(status_code=400, detail="보고서 내용을 입력해주세요.")

    with get_conn() as conn:
        lesson = conn.execute(
            """
            SELECT main_teacher_id FROM lesson
            WHERE id = %(lesson_id)s
              AND (main_teacher_id = %(teacher_id)s
                   OR id IN (SELECT lesson_id FROM lesson_assistant WHERE teacher_id = %(teacher_id)s))
            """,
            {"lesson_id": body.lesson_id, "teacher_id": teacher_id},
        ).fetchone()

        if lesson is None:
            raise HTTPException(status_code=403, detail="이 수업의 선생님이 아닙니다.")

        if lesson["main_teacher_id"] == teacher_id:
            if body.ended_at <= body.started_at:
                raise HTTPException(status_code=400, detail="종료 시각은 시작 시각보다 늦어야 합니다.")
            conn.execute(
                "UPDATE lesson SET started_at = %s, ended_at = %s WHERE id = %s",
                (body.started_at, body.ended_at, body.lesson_id),
            )

        try:
            report = conn.execute(
                """
                INSERT INTO report (lesson_id, teacher_id, report_content, homework_content)
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (body.lesson_id, teacher_id, body.report_content, body.homework_content),
            ).fetchone()
        except psycopg.errors.UniqueViolation:
            raise HTTPException(status_code=409, detail="이미 이 수업에 보고서를 썼습니다.")

    return {"report_id": report["id"]}


# ---------- 5. 보고서 목록과 누적 수업 완료 횟수 ----------

@app.get("/api/students/me/reports")
def my_reports(student_id: int = Depends(get_current_student)):
    with get_conn() as conn:
        count = conn.execute(
            """
            SELECT COUNT(*) AS completed_count
            FROM report r
            JOIN lesson l ON l.id = r.lesson_id
            WHERE l.student_id = %s
              AND l.lesson_type = 'regular'
              AND r.teacher_id = l.main_teacher_id
            """,
            (student_id,),
        ).fetchone()

        lessons = conn.execute(
            """
            SELECT l.id AS lesson_id, l.lesson_type, l.started_at, l.ended_at,
                   json_agg(
                       json_build_object(
                           'teacher_name', t.name,
                           'report_content', r.report_content,
                           'homework_content', r.homework_content
                       ) ORDER BY r.id
                   ) AS reports
            FROM lesson l
            JOIN report r ON r.lesson_id = l.id
            JOIN teacher t ON t.id = r.teacher_id
            WHERE l.student_id = %s
            GROUP BY l.id
            ORDER BY l.started_at DESC
            """,
            (student_id,),
        ).fetchall()

    return {"completed_count": count["completed_count"], "lessons": lessons}