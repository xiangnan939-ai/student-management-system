export const DEFAULT_THEME = 'default';

export const VALID_THEMES = new Set([
  DEFAULT_THEME,
  'liquid-glass',
  'morning-mist',
  'midnight-blue',
  'warm-paper',
]);

export function normalizeTheme(theme) {
  const value = String(theme || '').trim();
  return VALID_THEMES.has(value) ? value : DEFAULT_THEME;
}

export function validateThemeInput(input) {
  const theme = String(input?.theme || '').trim();
  if (!VALID_THEMES.has(theme)) {
    return { error: '主题不存在' };
  }

  return { theme };
}
