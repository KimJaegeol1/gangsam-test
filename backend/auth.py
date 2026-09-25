import os

import jwt

ALGORITHM = "HS256"


def create_token(user_id: int, role: str) -> str:
    """로그인한 사용자의 id와 역할(teacher / student)을 담은 JWT를 만든다."""
    payload = {"sub": str(user_id), "role": role}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=ALGORITHM)