import { Check } from 'lucide-react';
import { normalizeTheme, THEME_OPTIONS } from '../themes';

const ThemePicker = ({ activeTheme, saving = false, onSelect }) => {
  const normalizedTheme = normalizeTheme(activeTheme);

  return (
    <div className="theme-grid">
      {THEME_OPTIONS.map((theme) => {
        const isActive = normalizedTheme === theme.id;

        return (
          <button
            key={theme.id}
            type="button"
            className={`theme-card${isActive ? ' theme-card-active' : ''}`}
            onClick={() => onSelect?.(theme.id)}
            disabled={saving}
            aria-pressed={isActive}
            title={theme.description}
          >
            <span className={`theme-preview theme-preview-${theme.id}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>

            <span className="theme-card-content">
              <span className="theme-card-title">
                <span>{theme.name}</span>
                <span>{theme.tag}</span>
              </span>
            </span>

            <span className="theme-card-state">
              {isActive && (
                <span className="theme-active-mark">
                  <Check size={15} /> 已选
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemePicker;
