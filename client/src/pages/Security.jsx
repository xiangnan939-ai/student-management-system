import { useEffect, useState } from 'react';
import { Ban, Shield, Plus, Trash2, RefreshCw, Clock, X, AlertTriangle } from 'lucide-react';
import { authHeaders, jsonHeaders } from '../api';
import { displayBeijingTime } from '../time';

const DURATION_PRESETS = [
  { value: 0, label: '永久封禁' },
  { value: 60, label: '1 小时' },
  { value: 1440, label: '24 小时' },
  { value: 10080, label: '7 天' },
  { value: 43200, label: '30 天' },
];

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(6px)',
};

const modalStyle = {
  width: 'min(480px, calc(100vw - 32px))',
  background: 'var(--bg-surface-solid)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
  overflow: 'hidden',
};

function formatRemaining(expiresAt, permanent) {
  if (permanent) return '永久';
  const now = Date.now();
  const ms = expiresAt - now;
  if (ms <= 0) return '已过期';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const remainMins = minutes % 60;
  if (hours < 24) return `${hours} 小时${remainMins > 0 ? ` ${remainMins}分` : ''}`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return `${days} 天${remainHours > 0 ? ` ${remainHours}时` : ''}`;
}

const Security = () => {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [banIp, setBanIp] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState(0);
  const [unbanning, setUnbanning] = useState(null);

  const fetchBans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/security/banned-ips', { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setBans(data.data || []);
      else setError(data.error || '加载失败');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBans(); }, []);

  const resetForm = () => {
    setBanIp('');
    setBanReason('');
    setBanDuration(0);
    setError('');
  };

  const handleAddBan = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/security/banned-ips', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          ip: banIp.trim(),
          reason: banReason.trim(),
          durationMinutes: banDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '封禁失败');
      setSuccess(`已封禁 IP：${banIp}`);
      setShowAddModal(false);
      resetForm();
      fetchBans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnban = async (ip) => {
    if (!window.confirm(`确定要解封 IP ${ip} 吗？`)) return;
    setUnbanning(ip);
    setError('');
    try {
      const res = await fetch(`/api/security/banned-ips/${encodeURIComponent(ip)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '解封失败');
      setSuccess(`已解封 IP：${ip}`);
      fetchBans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUnbanning(null);
    }
  };

  const permanentCount = bans.filter(b => b.permanent).length;
  const temporaryCount = bans.length - permanentCount;

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={28} style={{ color: 'var(--primary)' }} />
            安全管理
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            IP 黑名单管理 · 登录安全控制
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={fetchBans} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> 刷新
          </button>
          <button type="button" className="btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> 封禁 IP
          </button>
        </div>
      </div>

      {(error || success) && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          border: `1px solid ${error ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          background: error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
          color: error ? 'var(--danger)' : 'var(--success)',
          fontSize: '0.88rem',
        }}>
          {error || success}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Ban size={14} style={{ color: 'var(--danger)' }} /> 封禁总数
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{bans.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} style={{ color: '#ff0044' }} /> 永久封禁
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ff0044' }}>{permanentCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} style={{ color: 'var(--warning)' }} /> 临时封禁
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>{temporaryCount}</div>
        </div>
      </div>

      {/* IP Ban List */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>IP 黑名单</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>共 {bans.length} 条</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
        ) : bans.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Ban size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>暂无封禁 IP</div>
          </div>
        ) : (
          <div>
            {bans.map(ban => (
              <div key={ban.ip} style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: ban.permanent ? '#ff0044' : 'var(--warning)',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <code style={{
                      fontSize: '0.95rem',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                    }}>{ban.ip}</code>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: ban.permanent ? 'rgba(255,0,68,0.15)' : 'rgba(245,158,11,0.15)',
                      color: ban.permanent ? '#ff0044' : 'var(--warning)',
                      fontWeight: 600,
                    }}>
                      {ban.permanent ? '永久' : formatRemaining(ban.expiresAt, false)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {ban.reason && <span>原因：{ban.reason}</span>}
                    <span>操作人：{ban.bannedBy}</span>
                    <span>封禁时间：{displayBeijingTime(ban.bannedAt)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnban(ban.ip)}
                  disabled={unbanning === ban.ip}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    background: 'transparent',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: 'var(--success)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: unbanning === ban.ip ? 0.6 : 1,
                  }}
                >
                  <Trash2 size={13} /> 解封
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Ban Modal */}
      {showAddModal && (
        <div className="terminal-overlay" style={modalBackdropStyle} onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <form className="terminal-modal" style={modalStyle} onSubmit={handleAddBan}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ban size={18} style={{ color: 'var(--danger)' }} /> 封禁 IP 地址
              </h2>
              <button type="button" onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>IP 地址 *</label>
                <input
                  className="input-field"
                  placeholder="例如：192.168.1.100"
                  value={banIp}
                  onChange={e => setBanIp(e.target.value)}
                  required
                  autoFocus
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>封禁时长</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DURATION_PRESETS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setBanDuration(p.value)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        borderRadius: '6px',
                        border: `1px solid ${banDuration === p.value ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: banDuration === p.value ? 'var(--primary-glow)' : 'transparent',
                        color: banDuration === p.value ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: banDuration === p.value ? 600 : 400,
                      }}
                    >{p.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>封禁原因</label>
                <input
                  className="input-field"
                  placeholder="例如：多次暴力破解密码"
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                />
              </div>

              {error && <div style={{ color: 'var(--danger)', fontSize: '0.88rem' }}>{error}</div>}
            </div>

            <div style={{ padding: '18px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowAddModal(false)}
                className="btn-secondary" style={{ padding: '8px 16px' }}>
                取消
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Ban size={15} /> {submitting ? '封禁中...' : '确认封禁'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Security;
