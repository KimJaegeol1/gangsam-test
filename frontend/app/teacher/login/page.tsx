"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function TeacherLoginPage() {
  const router = useRouter();

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const res = await fetch("/api/teachers/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), phone: form.get("phone") }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // 보고서 작성 화면에서 쓸 토큰과 이름. 탭을 닫으면 지워진다.
    sessionStorage.setItem("teacherToken", data.token);
    sessionStorage.setItem("teacherName", data.teacher.name);
    router.push("/teacher/report");
  }

  return (
    <>
      <Header role="선생님" />
      <main className="main login">
        <form className="card login-card" onSubmit={handleSubmit}>
          <div className="login-head">
            <div className="role-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0052d3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>
            <h1 className="login-title">선생님 로그인</h1>
          </div>

          <div className="login-fields">
            <div className="field">
              <label className="field-label" htmlFor="name">
                이름
              </label>
              <input
                className="input"
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="phone">
                전화번호
              </label>
              <input
                className="input"
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="01012345678"
              />
            </div>
          </div>

          <button className="btn-primary" type="submit">
            로그인
          </button>
        </form>
      </main>
    </>
  );
}