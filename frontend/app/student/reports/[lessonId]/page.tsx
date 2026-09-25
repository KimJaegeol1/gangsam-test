"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

export default function StudentReportDetailPage() {
  const router = useRouter();
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson>();

  // 상세 API가 따로 없어서 5번 API를 불러 주소의 수업을 찾는다.
  // 토큰이 없거나 잘못되면 로그인 화면으로, 수업이 없으면 목록으로 보낸다.
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

      const found = data.lessons.find((l: Lesson) => String(l.lesson_id) === lessonId);
      if (!found) {
        alert("보고서를 찾을 수 없습니다.");
        router.replace("/student/reports");
        return;
      }

      setLesson(found);
    });

    return () => {
      ignore = true;
    };
  }, [router, lessonId]);

  return (
    <>
      <Header role="학생" />
      <main className="main detail">
        <Link className="back-link" href="/student/reports">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          보고서 목록
        </Link>
        <h1 className="page-title">수업 보고서</h1>

        {/* 보고서마다 카드 하나. 보고서 순서는 5번 API가 준 작성 순서 그대로다. */}
        {lesson &&
          lesson.reports.map((report, index) => (
            <article className="card detail-card" key={index}>
              <div className="info-grid">
                <div className="info">
                  <span className="info-label">작성 선생님</span>
                  <span className="info-value">{report.teacher_name} 선생님</span>
                </div>
                <div className="info">
                  <span className="info-label">수업 종류</span>
                  <span className="info-value">{LESSON_TYPE_LABEL[lesson.lesson_type]}</span>
                </div>
                <div className="info">
                  <span className="info-label">수업 시간</span>
                  <span className="info-value">
                    {formatDate(lesson.started_at)} {formatTime(lesson.started_at)} ~ {formatTime(lesson.ended_at)}
                  </span>
                </div>
              </div>

              <div className="divider" />

              <span className="section-title">보고서 내용</span>
              <p className="body-text">{report.report_content}</p>

              <div className="divider" />

              <span className="section-title">숙제 내용</span>
              <p className="body-text">{report.homework_content ?? "없음"}</p>
            </article>
          ))}
      </main>
    </>
  );
}