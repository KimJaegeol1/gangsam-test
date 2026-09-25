"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LoginForm from "@/components/LoginForm";

export default function StudentLoginPage() {
  const router = useRouter();

  async function login(name: string, phone: string) {
    const res = await fetch("/api/students/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // 보고서 목록 화면에서 쓸 토큰. 탭을 닫으면 지워진다.
    sessionStorage.setItem("studentToken", data.token);
    router.push("/student/reports");
  }

  return (
    <>
      <Header role="학생" />
      <main className="main login">
        <LoginForm
          title="학생 로그인"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0052d3"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
          }
          onSubmit={login}
        />
      </main>
    </>
  );
}