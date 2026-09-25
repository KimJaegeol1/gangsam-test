type LoginFormProps = {
  title: string; // 예: 선생님 로그인
  icon: React.ReactNode; // 제목 위 동그라미 안에 들어가는 아이콘
  onSubmit: (name: string, phone: string) => void;
};

// 선생님 로그인과 학생 로그인이 같이 쓰는 폼
export default function LoginForm({ title, icon, onSubmit }: LoginFormProps) {
  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit(String(form.get("name")), String(form.get("phone")));
  }

  return (
    <form className="card login-card" onSubmit={handleSubmit}>
      <div className="login-head">
        <div className="role-icon">{icon}</div>
        <h1 className="login-title">{title}</h1>
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
  );
}