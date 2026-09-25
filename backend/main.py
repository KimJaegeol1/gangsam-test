from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from auth import create_token
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