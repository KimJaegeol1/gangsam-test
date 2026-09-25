type HeaderProps = {
  role?: string; // 오른쪽에 보이는 글자. 예: 선생님, 학생
};

export default function Header({ role }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <svg viewBox="0 0 30 30" aria-hidden="true">
          <path d="M15 2C15 2 5 12 5 18.5a10 10 0 0 0 20 0C25 12 15 2 15 2z" fill="#2f7cf6" />
        </svg>
        <span>Kangsam study</span>
      </div>
      {role && <span className="header-role">{role}</span>}
    </header>
  );
}