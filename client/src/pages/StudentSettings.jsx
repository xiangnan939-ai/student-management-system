import { useState } from 'react';
import { KeyRound, Palette, Save, X } from 'lucide-react';
import { jsonHeaders } from '../api';

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(6px)',
};

const modalStyle = {
  width: 'min(460px, calc(100vw - 32px))',
  background: 'var(--bg-surface-solid)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
  overflow: 'hidden',
};

const StudentSettings = ({ setCurrentUser }) => {
  const [password, setPassword] = useState('');
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const changePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/student/me/password', {
        method: 'PUT',
        headers: jsonHeaders(),
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '修改失败');

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'student');
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('displayName', data.user.name || data.user.username);
      localStorage.setItem('isAdmin', 'false');
      setCurrentUser?.({ ...data.user, isAdmin: false });
      setPassword('');
      setMessage('密码已修改');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '680px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>系统设置</h1>
      </div>

      {(message || error) && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            border: `1px solid ${error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: error ? 'var(--danger)' : 'var(--success)',
          }}
        >
          {error || message}
        </div>
      )}

      <form className="glass-panel" onSubmit={changePassword} style={{ padding: '28px', display: 'grid', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
          <KeyRound size={20} />
          <span>请输入新密码</span>
        </div>
        <input
          className="input-field"
          type="password"
          placeholder="请输入新密码"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={18} /> 保存
          </button>
        </div>
      </form>

      <div className="glass-panel" style={{ padding: '28px' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setThemeModalOpen(true)}
          style={{ width: 'fit-content', minWidth: '160px', justifyContent: 'center' }}
        >
          <Palette size={18} /> 更换主题
        </button>
      </div>

      {themeModalOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalStyle}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem' }}>更换主题</h2>
              <button type="button" onClick={() => setThemeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="关闭">
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: '12px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setError('');
                  setMessage('已应用默认主题');
                  setThemeModalOpen(false);
                }}
                style={{ justifyContent: 'center' }}
              >
                默认主题（当前主题）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSettings;
