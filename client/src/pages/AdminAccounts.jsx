import { useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, RefreshCw, Save, Search, Shield, Trash2, UserCog, UsersRound, X } from 'lucide-react';
import { authHeaders, jsonHeaders, saveAuth } from '../api';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  background: 'rgba(0, 0, 0, 0.58)',
  backdropFilter: 'blur(8px)',
  overflow: 'hidden',
};

const modalStyle = {
  width: 'min(1080px, calc(100vw - 40px))',
  height: 'min(760px, calc(100dvh - 40px))',
  maxHeight: 'calc(100dvh - 40px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const modalBodyStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '18px',
};

const AdminAccounts = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [studentKeyword, setStudentKeyword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const showMessage = (text) => {
    setMessage(text);
    setError('');
  };

  const showError = (text) => {
    setError(text);
    setMessage('');
  };

  const fetchAccounts = async () => {
    setAdminLoading(true);
    setError('');

    try {
      const response = await fetch('/api/accounts', { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '管理员账号读取失败');
      setAccounts(data.data || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchStudents = async (keyword = studentKeyword) => {
    setStudentLoading(true);
    setError('');

    try {
      const query = encodeURIComponent(keyword.trim());
      const response = await fetch(`/api/students?page=1&limit=100&keyword=${query}`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '学生账号读取失败');
      setStudents(data.data || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setStudentLoading(false);
    }
  };

  const openAdminModal = () => {
    setActiveModal('admins');
    setMessage('');
    setError('');
    fetchAccounts();
  };

  const openStudentModal = () => {
    setActiveModal('students');
    setMessage('');
    setError('');
    fetchStudents(studentKeyword);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSavingId(null);
  };

  const searchStudents = (event) => {
    event.preventDefault();
    fetchStudents(studentKeyword);
  };

  const renderModal = (content) => createPortal(content, document.body);

  const updateLocalPassword = (id, password) => {
    setAccounts((items) => items.map((account) => (
      account.id === id ? { ...account, password } : account
    )));
  };

  const saveAdminPassword = async (account) => {
    setSavingId(`admin-${account.id}`);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        headers: jsonHeaders(),
        body: JSON.stringify({
          username: account.username,
          password: account.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存失败');

      if (data.token && data.user) {
        saveAuth(data.token, { ...data.user, isAdmin: data.user.isAdmin !== false });
      }

      setAccounts((items) => items.map((item) => (item.id === account.id ? data.account : item)));
      showMessage(`管理员「${account.username}」密码已修改`);
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const deleteAdminAccount = async (account) => {
    if (!window.confirm(`确定删除管理员账号「${account.username}」吗？删除后该账号将无法登录。`)) return;

    setSavingId(`admin-${account.id}`);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '删除失败');

      setAccounts((items) => items.filter((item) => item.id !== account.id));
      showMessage(`管理员「${account.username}」已删除`);
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const resetStudentPassword = async (student) => {
    if (!window.confirm(`确定把学生「${student.name}」的登录密码初始化为 123456 吗？`)) return;

    setSavingId(`student-${student.id}`);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/students/${student.id}/password`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '初始化失败');

      setStudents((items) => items.map((item) => (item.id === student.id ? { ...item, ...(data.student || {}) } : item)));
      showMessage(`学生「${student.name}」密码已初始化为 123456`);
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>账号管理</h1>
        <p style={{ color: 'var(--text-muted)' }}>admin 专属</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', maxWidth: '720px' }}>
        <button
          type="button"
          className="glass-panel"
          onClick={openAdminModal}
          style={{ padding: '28px', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <Shield size={26} color="var(--primary)" />
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>管理员账户管理</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>修改管理员密码、删除普通管理员账号。</p>
        </button>

        <button
          type="button"
          className="glass-panel"
          onClick={openStudentModal}
          style={{ padding: '28px', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <UsersRound size={26} color="var(--success)" />
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>学生账户管理</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>将学生登录密码初始化为默认密码 123456。</p>
        </button>
      </div>

      {activeModal === 'admins' && renderModal(
        <div className="terminal-overlay" style={overlayStyle}>
          <div className="glass-panel glass-panel-elevated terminal-modal" style={modalStyle}>
            <div className="flex-between" style={{ flexShrink: 0, padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem' }}>管理员账户管理</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '4px' }}>admin 账号只允许修改密码，不允许删除。</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={fetchAccounts} disabled={adminLoading} style={{ padding: '8px 12px' }}>
                  <RefreshCw size={16} /> 刷新
                </button>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="关闭">
                  <X size={22} />
                </button>
              </div>
            </div>

            <div style={modalBodyStyle}>
              {adminLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>管理员账号加载中...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>序号</th>
                        <th>账号</th>
                        <th>新密码</th>
                        <th>权限</th>
                        <th style={{ textAlign: 'right' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account, index) => (
                        <tr key={account.id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{index + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 650 }}>
                              <UserCog size={18} color="var(--primary)" />
                              {account.username}
                            </div>
                          </td>
                          <td>
                            <input
                              className="input-field"
                              value={account.password}
                              onChange={(event) => updateLocalPassword(account.id, event.target.value)}
                            />
                          </td>
                          <td>
                            <span className={`badge ${account.username === 'admin' ? 'badge-blue' : 'badge-green'}`}>
                              {account.username === 'admin' ? 'admin' : '普通管理员'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => saveAdminPassword(account)}
                                disabled={savingId === `admin-${account.id}`}
                                style={{ padding: '8px 14px' }}
                              >
                                <Save size={16} /> 保存密码
                              </button>
                              <button
                                type="button"
                                className="btn-danger"
                                onClick={() => deleteAdminAccount(account)}
                                disabled={savingId === `admin-${account.id}` || account.username === 'admin'}
                                style={{ padding: '8px 14px' }}
                              >
                                <Trash2 size={16} /> 删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {accounts.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                            暂无管理员账号。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'students' && renderModal(
        <div className="terminal-overlay" style={overlayStyle}>
          <div className="glass-panel glass-panel-elevated terminal-modal" style={modalStyle}>
            <div className="flex-between" style={{ flexShrink: 0, padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem' }}>学生账户管理</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '4px' }}>初始化后，学生可使用默认密码 123456 登录。</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => fetchStudents(studentKeyword)} disabled={studentLoading} style={{ padding: '8px 12px' }}>
                  <RefreshCw size={16} /> 刷新
                </button>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="关闭">
                  <X size={22} />
                </button>
              </div>
            </div>

            <div style={modalBodyStyle}>
              <form
                onSubmit={searchStudents}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-dim)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    className="input-field"
                    value={studentKeyword}
                    onChange={(event) => setStudentKeyword(event.target.value)}
                    placeholder="按学号或姓名搜索学生账号"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={studentLoading} style={{ padding: '10px 16px', flexShrink: 0 }}>
                  <Search size={16} /> 搜索
                </button>
              </form>

              {studentLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>学生账号加载中...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>学号</th>
                        <th>姓名</th>
                        <th>专业</th>
                        <th>联系电话</th>
                        <th style={{ textAlign: 'right' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{student.id}</td>
                          <td style={{ fontWeight: 650 }}>{student.name}</td>
                          <td>{student.major}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{student.phone || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => resetStudentPassword(student)}
                              disabled={savingId === `student-${student.id}`}
                              style={{ padding: '8px 14px' }}
                            >
                              <KeyRound size={16} /> 初始化密码
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                            暂无学生账号。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccounts;
