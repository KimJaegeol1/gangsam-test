import os
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row


@contextmanager
def get_conn():
    """DB 연결을 열고 끝나면 닫는다.

    블록 안에서 에러가 없으면 커밋, 에러가 나면 롤백한다.
    그래서 한 블록 안의 쿼리들은 하나의 트랜잭션으로 묶인다.
    """
    with psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row) as conn:
        yield conn