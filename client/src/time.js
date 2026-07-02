export function displayBeijingTime(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  return `北京时间 ${text.replace(/\s*\+08:00$/, '')}`;
}
