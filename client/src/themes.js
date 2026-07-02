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
    description: '参考 Liquid Glass 的折射边缘、色差光边和弹性反馈，适合追求科技感的界面。',
    swatches: ['#071321', '#d8f6ff', '#b8a9ff'],
  },
  {
    id: 'morning-mist',
    name: '瓷白晨雾',
    tag: '清爽办公',
    description: '白瓷底、雾蓝控件和细金强调，适合明亮环境下长时间看表格和数据。',
    swatches: ['#f7f8f6', '#3f8395', '#c6a15f'],
  },
  {
    id: 'midnight-blue',
    name: '曜石控制台',
    tag: '专业深色',
    description: '接近石墨的深底、冷青信息色和钴蓝辅助色，偏企业级数据驾驶舱。',
    swatches: ['#071018', '#63c7d5', '#90a8ff'],
  },
  {
    id: 'warm-paper',
    name: '暖纸书房',
    tag: '柔和纸感',
    description: '温润纸色、咖金按钮和鼠尾草绿点缀，阅读压力更低，整体更亲和。',
    swatches: ['#f7efe4', '#9b663f', '#6f8d76'],
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
