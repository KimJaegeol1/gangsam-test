// 화면에 보여줄 문구를 만든다. 시간은 한국 시간 기준으로 보여준다.

export const LESSON_TYPE_LABEL = {
  regular: "정규 수업",
  ontact: "온택트 수업",
};

// 예: 9월 24일 (목)
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

// 예: 14:00
export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}