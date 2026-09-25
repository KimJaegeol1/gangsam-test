import os

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

ALGORITHM = "HS256"

bearer = HTTPBearer(auto_error=False)  # 요청 헤더의 "Authorization: Bearer <토큰>"을 읽는다


def create_token(user_id: int, role: str) -> str:
    """로그인한 사용자의 id와 역할(teacher / student)을 담은 JWT를 만든다."""
    payload = {"sub": str(user_id), "role": role}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=ALGORITHM)


def get_current_teacher(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> int:
    """토큰을 확인하고, 선생님 토큰이면 그 선생님의 id를 돌려준다."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="토큰이 없거나 잘못되었습니다.")

    try:
        payload = jwt.decode(credentials.credentials, os.environ["JWT_SECRET"], algorithms=[ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="토큰이 없거나 잘못되었습니다.")

    if payload["role"] != "teacher":
        raise HTTPException(status_code=403, detail="선생님만 사용할 수 있습니다.")

    return int(payload["sub"])