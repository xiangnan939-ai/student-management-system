import { useState } from 'react';
import { KeyRound, Save, UserPlus, X } from 'lucide-react';
import { jsonHeaders } from '../api';

const emptyAdminForm = { username: '', password: '' };

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

const Settings = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const closeModal = () => {
    setActiveModal(null);
    setAdminForm(emptyAdminForm);
    setNewPassword('');
    setError('');
  };

  const saveAdmin = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(adminForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存失败');

      setMessage('管理员账号已保存');
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/me/password', {
        method: 'PUT',
        headers: jsonHeaders(),
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '修改失败');

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('displayName', data.user.name || data.user.username);
      localStorage.setItem('isAdmin', data.user.isAdmin ? 'true' : 'false');
      setMessage('密码已修改');
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '760px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>系统设置</h1>
        <p style={{ color: 'var(--text-muted)' }}>账号安全</p>
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

      <div className="glass-panel" style={{ padding: '28px', display: 'grid', gap: '16px' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setActiveModal('add')}
          style={{ width: 'fit-content', minWidth: '160px', justifyContent: 'center' }}
        >
          <UserPlus size={18} /> 添加管理员
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => setActiveModal('password')}
          style={{ width: 'fit-content', minWidth: '160px', justifyContent: 'center' }}
        >
          <KeyRound size={18} /> 修改密码
        </button>
      </div>

      {activeModal === 'add' && (
        <div style={modalBackdropStyle}>
          <form style={modalStyle} onSubmit={saveAdmin}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem' }}>添加管理员</h2>
              <button type="button" onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="关闭">
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>
              <input
                className="input-field"
                placeholder="输入账号"
                value={adminForm.username}
                onChange={(event) => setAdminForm({ ...adminForm, username: event.target.value })}
                required
              />
              <input
                className="input-field"
                type="password"
                placeholder="输入密码"
                value={adminForm.password}
                onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })}
                required
              />
              {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}
            </div>

            <div style={{ padding: '18px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save size={18} /> 保存
              </button>
            </div>
          </form>
        </div>
      )}

      {activeModal === 'password' && (
        <div style={modalBackdropStyle}>
          <form style={modalStyle} onSubmit={changePassword}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem' }}>请输入新密码</h2>
              <button type="button" onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="关闭">
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>
              <input
                className="input-field"
                type="password"
                placeholder="请输入新密码"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
              {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}
            </div>

            <div style={{ padding: '18px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save size={18} /> 保存
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Settings;
