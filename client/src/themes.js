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
    tag: '通透流体',
    description: '更强的半透明玻璃层、冷白高光和青紫渐变，界面更轻、更有科技感。',
    swatches: ['#07111f', '#b8e7ff', '#b6a7ff'],
  },
  {
    id: 'morning-mist',
    name: '晨雾浅色',
    tag: '清爽办公',
    description: '浅色背景、柔和青蓝和低饱和边框，适合明亮环境下查看数据。',
    swatches: ['#f4f7f8', '#4d8fa5', '#c8a46a'],
  },
  {
    id: 'midnight-blue',
    name: '墨蓝专业',
    tag: '稳重深色',
    description: '深海蓝底、冷静青色焦点和清晰层级，偏企业级控制台风格。',
    swatches: ['#081522', '#67c6d4', '#8ea8ff'],
  },
  {
    id: 'warm-paper',
    name: '暖砂纸感',
    tag: '柔和纸感',
    description: '温暖纸色、咖金按钮和柔软阴影，阅读压力更低，整体更亲和。',
    swatches: ['#f6efe5', '#a97145', '#6f8f7a'],
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
