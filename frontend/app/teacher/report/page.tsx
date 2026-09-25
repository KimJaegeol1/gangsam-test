"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { LESSON_TYPE_LABEL, formatDate, formatTime } from "@/lib/format";

// 3번 API(보고서를 쓸 수업 목록)의 수업 하나
type Lesson = {
  lesson_id: number;
  student_name: string;
  lesson_type: "regular" | "ontact";
  started_at: string;
  ended_at: string;
  role: "main" | "assistant";
};

function authHeader() {
  return { Authorization: `Bearer ${sessionStorage.getItem("teacherToken")}` };
}

// 수업 날짜는 그대로 두고 시각만 바꾼다. 예: 2026-09-24T14:00:00+09:00 + "14:10" → 2026-09-24T14:10:00+09:00
function withTime(iso: string, time: string) {
  const date = new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }); // sv-SE 형식이 2026-09-24 모양이라 사용
  return `${date}T${time}:00+09:00`;
}

// 수정할 수 없는 칸 (자물쇠 + '수정 불가')
function LockedInput({ id, value }: { id: string; value: string }) {
  return (
    <div className="readonly-wrap">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6b7280"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      <input className="input readonly" id={id} type="text" value={value} readOnly />
      <span className="lock-badge">수정 불가</span>
    </div>
  );
}

export default function TeacherReportPage() {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // 바뀌면 수업 목록을 다시 불러온다

  const lesson = lessons.find((l) => String(l.lesson_id) === lessonId);
  const timeLocked = lesson?.role === "assistant"; // 보조 선생님은 수업 시간을 고칠 수 없다

  // 수업 목록(3번 API)을 불러온다. 토큰이 없거나 잘못되면 로그인 화면으로 보낸다.
  useEffect(() => {
    let ignore = false; // 먼저 보낸 요청의 응답이 늦게 오면 무시한다

    fetch("/api/teachers/me/lessons", { headers: authHeader() }).then(async (res) => {
      const data = await res.json();
      if (ignore) return;

      if (!res.ok) {
        alert(data.message);
        router.replace("/teacher/login");
        return;
      }

      setTeacherName(sessionStorage.getItem("teacherName") ?? "");
      setLessons(data);
    });

    return () => {
      ignore = true;
    };
  }, [router, reloadKey]);

  // 수업을 고르면 3번 API에 있던 그 수업의 시간으로 채운다
  function selectLesson(id: string) {
    const selected = lessons.find((l) => String(l.lesson_id) === id);
    if (!selected) return;

    setLessonId(id);
    setStartTime(formatTime(selected.started_at));
    setEndTime(formatTime(selected.ended_at));
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lesson) return; // 수업 선택은 required라 실제로는 항상 있다

    const form = event.currentTarget;
    const values = new FormData(form);

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        lesson_id: lesson.lesson_id,
        started_at: withTime(lesson.started_at, startTime),
        ended_at: withTime(lesson.ended_at, endTime),
        report_content: values.get("report"),
        homework_content: values.get("homework") || null, // 숙제가 없으면 null
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("보고서가 등록되었습니다.");
    form.reset();
    setLessonId("");
    setStartTime("");
    setEndTime("");
    setReloadKey((key) => key + 1);
  }

  return (
    <>
      <Header role="수업 보고서" />
      <main className="main">
        <h1 className="page-title">수업 보고서 작성</h1>

        <form className="card form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="field">
              <label className="field-label" htmlFor="lesson">
                수업 선택
              </label>
              <div className="select-wrap">
                <select
                  className="select"
                  id="lesson"
                  value={lessonId}
                  onChange={(e) => selectLesson(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    수업을 선택하세요
                  </option>
                  {lessons.map((l) => (
                    <option key={l.lesson_id} value={l.lesson_id}>
                      {formatDate(l.started_at)} {formatTime(l.started_at)} · {l.student_name}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="teacher">
                작성 선생님
              </label>
              <LockedInput id="teacher" value={teacherName} />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="field-label" htmlFor="type">
                수업 종류
              </label>
              <LockedInput id="type" value={lesson ? LESSON_TYPE_LABEL[lesson.lesson_type] : ""} />
            </div>

            <div className="field">
              <span className="field-label">수업 시간</span>
              <div className="time-row">
                <div className="time-col">
                  <label className="time-caption" htmlFor="start">
                    시작
                  </label>
                  <input
                    className="input time"
                    id="start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    readOnly={timeLocked}
                  />
                </div>
                <span className="time-sep">~</span>
                <div className="time-col">
                  <label className="time-caption" htmlFor="end">
                    종료
                  </label>
                  <input
                    className="input time"
                    id="end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    readOnly={timeLocked}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="report">
              보고서 내용
            </label>
            <textarea
              className="textarea"
              id="report"
              name="report"
              placeholder="오늘 수업에서 다룬 내용과 학생의 이해도를 적어주세요."
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="homework">
              숙제 내용
            </label>
            <textarea
              className="textarea short"
              id="homework"
              name="homework"
              placeholder="다음 수업까지 해올 숙제를 적어주세요."
            />
          </div>

          <div className="btn-row">
            <button className="btn-primary" type="submit">
              작성 완료
            </button>
          </div>
        </form>
      </main>
    </>
  );
}