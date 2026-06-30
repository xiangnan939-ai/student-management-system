import { useEffect, useState } from 'react';
import { RefreshCw, Save, Shield, Trash2 } from 'lucide-react';
import { authHeaders, jsonHeaders } from '../api';

const AdminAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/accounts', { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '账号读取失败');
      setAccounts(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadAccounts = async () => {
      try {
        const response = await fetch('/api/accounts', { headers: authHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '账号读取失败');
        if (!ignore) setAccounts(data.data || []);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadAccounts();

    return () => {
      ignore = true;
    };
  }, []);

  const updateLocalAccount = (id, field, value) => {
    setAccounts((items) => items.map((account) => (
      account.id === id ? { ...account, [field]: value } : account
    )));
  };

  const saveAccount = async (account) => {
    setSavingId(account.id);
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

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('displayName', data.user.name || data.user.username);
        localStorage.setItem('isAdmin', data.user.isAdmin ? 'true' : 'false');
      }
      setAccounts((items) => items.map((item) => (item.id === account.id ? data.account : item)));
      setMessage('账号信息已保存');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const deleteAccount = async (account) => {
    if (!window.confirm(`确定删除管理员账号「${account.username}」吗？删除后该账号将无法登录。`)) return;

    setSavingId(account.id);
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
      setMessage('账号已删除');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>账号管理</h1>
          <p style={{ color: 'var(--text-muted)' }}>admin 专属</p>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchAccounts} disabled={loading}>
          <RefreshCw size={18} /> 刷新
        </button>
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

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>账号数据加载中...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>账号</th>
                  <th>密码</th>
                  <th>权限</th>
                  <th>更新时间</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account, index) => (
                  <tr key={account.id}>
                    <td title={`数据库 ID: ${account.id}`} style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
                      <input
                        className="input-field"
                        value={account.username}
                        disabled={account.username === 'admin'}
                        onChange={(event) => updateLocalAccount(account.id, 'username', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input-field"
                        value={account.password}
                        onChange={(event) => updateLocalAccount(account.id, 'password', event.target.value)}
                      />
                    </td>
                    <td>
                      <span className={`badge ${account.username === 'admin' ? 'badge-blue' : 'badge-green'}`}>
                        {account.username === 'admin' ? 'admin' : '普通账户'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{account.updatedAt || account.createdAt || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => saveAccount(account)}
                          disabled={savingId === account.id}
                          style={{ padding: '8px 14px' }}
                        >
                          {account.username === 'admin' ? <Shield size={16} /> : <Save size={16} />}
                          保存
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => deleteAccount(account)}
                          disabled={savingId === account.id || account.username === 'admin'}
                          style={{ padding: '8px 14px' }}
                        >
                          <Trash2 size={16} />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                      暂无账号。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAccounts;
