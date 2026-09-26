/** ミリ秒を m:ss で表す（負の値は 0:00） */
export function formatTime(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}
