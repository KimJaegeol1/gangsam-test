import Link from "next/link";
import Header from "@/components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="main">
        <div className="card grid-2">
          <Link className="btn-primary" href="/teacher/login">
            선생님 로그인
          </Link>
          <Link className="btn-primary" href="/student/login">
            학생 로그인
          </Link>
        </div>
      </main>
    </>
  );
}