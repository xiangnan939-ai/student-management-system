export const DEFAULT_THEME = 'default';

export const THEME_OPTIONS = [
  {
    id: 'default',
    name: '默认主题',
    tag: '当前主题',
    description: '高级深色、低对比留白、蓝金点缀，适合长时间管理后台使用。',
    swatches: ['#0b0d12', '#8fb7e8', '#d5bd8a'],
  },
  {
    id: 'liquid-glass',
    name: '液态玻璃',
    tag: '折射高光',
    description: '多色流动背景、分层玻璃材质与低频折射高光，适合追求沉浸感的界面。',
    swatches: ['#071321', '#d8f6ff', '#b8a9ff'],
  },
  {
    id: 'matrix',
    name: '黑客帝国',
    tag: '字符雨',
    description: '黑色终端基底与持续下落的绿色英文字母，适合偏沉浸式的操作视图。',
    swatches: ['#030804', '#6dff75', '#00b84f'],
  },
];

export function normalizeTheme(theme) {
  return THEME_OPTIONS.some((option) => option.id === theme) ? theme : DEFAULT_THEME;
}

export function getThemeOption(theme) {
  const normalized = normalizeTheme(theme);
  return THEME_OPTIONS.find((option) => option.id === normalized) || THEME_OPTIONS[0];
}

export function themeSavedMessage(theme) {
  return `已应用${getThemeOption(theme).name}`;
}

export function applyTheme(theme) {
  const normalized = normalizeTheme(theme);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = normalized;
  }
  return normalized;
}

export function persistTheme(theme) {
  const normalized = applyTheme(theme);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', normalized);
  }
  return normalized;
}

export function getStoredTheme() {
  if (typeof localStorage === 'undefined') return DEFAULT_THEME;
  return normalizeTheme(localStorage.getItem('theme'));
}
