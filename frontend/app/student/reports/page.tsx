"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { LESSON_TYPE_LABEL, formatDate, formatTime } from "@/lib/format";

// 5번 API(보고서 목록과 누적 수업 완료 횟수)의 수업 하나
type Lesson = {
  lesson_id: number;
  lesson_type: "regular" | "ontact";
  started_at: string;
  ended_at: string;
  reports: { teacher_name: string; report_content: string; homework_content: string | null }[];
};

export default function StudentReportsPage() {
  const router = useRouter();
  const [completedCount, setCompletedCount] = useState<number>(); // 불러오기 전에는 비워 둔다
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // 5번 API를 불러온다. 토큰이 없거나 잘못되면 로그인 화면으로 보낸다.
  useEffect(() => {
    let ignore = false; // 먼저 보낸 요청의 응답이 늦게 오면 무시한다

    fetch("/api/students/me/reports", {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("studentToken")}` },
    }).then(async (res) => {
      const data = await res.json();
      if (ignore) return;

      if (!res.ok) {
        alert(data.message);
        router.replace("/student/login");
        return;
      }

      setCompletedCount(data.completed_count);
      setLessons(data.lessons);
    });

    return () => {
      ignore = true;
    };
  }, [router]);

  return (
    <>
      <Header role="학생" />
      <main className="main">
        <h1 className="page-title">수업 보고서 조회</h1>

        <section className="card summary">
          <div className="summary-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0052d3"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12l3 3 5-6" />
            </svg>
          </div>
          <div>
            <div className="summary-label">누적 수업 완료 횟수</div>
            <div className="summary-count">
              <b>{completedCount}</b>
              <span>회</span>
            </div>
          </div>
        </section>

        <span className="list-title">보고서 목록</span>
        <ul className="report-list">
          {lessons.map((lesson) => {
            const teachers = lesson.reports.map((r) => r.teacher_name).join(", ");

            return (
              <li key={lesson.lesson_id}>
                <Link className="report-row" href={`/student/reports/${lesson.lesson_id}`}>
                  <div className="row-body">
                    <div className="row-head">
                      <span className="row-title">{formatDate(lesson.started_at)}</span>
                      <span className="tag">{LESSON_TYPE_LABEL[lesson.lesson_type]}</span>
                    </div>
                    <span className="row-meta">
                      {teachers} 선생님 · {formatTime(lesson.started_at)} ~ {formatTime(lesson.ended_at)}
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9aa3b2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}