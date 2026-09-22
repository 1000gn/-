/**
 * Calculates the next N scheduled run dates given selected weekdays (0=Sun, 1=Mon, ..., 6=Sat)
 * and time "HH:mm" in Asia/Seoul timezone.
 */

export function getNextScheduledDates(
  weekdays: number[],
  timeStr: string,
  count: number = 4
): Date[] {
  if (!weekdays || weekdays.length === 0) return [];

  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const results: Date[] = [];

  // Check the next 60 days
  let currentCandidate = new Date(now);
  currentCandidate.setSeconds(0, 0);

  for (let i = 0; i < 60 && results.length < count; i++) {
    const candidate = new Date(currentCandidate);
    candidate.setDate(candidate.getDate() + i);
    candidate.setHours(hours, minutes, 0, 0);

    const dayOfWeek = candidate.getDay(); // 0 is Sun, 1 is Mon, etc.
    if (weekdays.includes(dayOfWeek)) {
      if (candidate.getTime() > now.getTime()) {
        results.push(new Date(candidate));
      }
    }
  }

  return results;
}

export function formatKoreanDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dayName = dayNames[d.getDay()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day}(${dayName}) ${hours}:${minutes} KST`;
}

export function formatRelativeKoreanDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 3) {
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  } else if (diffDay > 0) {
    return `${diffDay}일 전`;
  } else if (diffHour > 0) {
    return `${diffHour}시간 전`;
  } else if (diffMin > 0) {
    return `${diffMin}분 전`;
  } else {
    return '방금 전';
  }
}
