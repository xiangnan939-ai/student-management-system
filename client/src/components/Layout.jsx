import { useEffect, useState, useCallback, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  BookOpen, 
  Settings,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react';
import { authHeaders, jsonHeaders } from '../api';
import { displayBeijingTime } from '../time';

const TYPE_MAP = {
  feedback: { label: '反馈', color: 'var(--primary)' },
  question: { label: '疑问', color: 'var(--warning)' },
  bug: { label: 'Bug', color: 'var(--danger)' },
  suggestion: { label: '建议', color: 'var(--success)' },
};

const STATUS_MAP = {
  pending: { label: '待处理', icon: Clock, color: 'var(--warning)' },
  replied: { label: '已回复', icon: MessageSquare, color: 'var(--success)' },
  closed: { label: '已关闭', icon: CheckCircle, color: 'var(--text-dim)' },
};

const Layout = ({ setIsAuthenticated, currentUser, setCurrentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellTab, setBellTab] = useState('feedback');
  const [alerts, setAlerts] = useState([]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [replyingId, setReplyingId] = useState(null);
  const replyInputRef = useRef({});
  const bellRef = useRef(null);

  const username = currentUser?.username || localStorage.getItem('username') || '管理员';
  const isAdmin = username === 'admin';

  const navItems = [
    { path: '/dashboard', name: '系统看板', icon: LayoutDashboard },
    { path: '/students', name: '学籍管理', icon: Users },
    { path: '/courses', name: '课程管理', icon: BookOpen },
    { path: '/settings', name: '系统设置', icon: Settings },
    ...(isAdmin ? [{ path: '/admin-accounts', name: '账号管理', icon: Shield }] : []),
  ];

  const breadcrumbMap = {
    '/dashboard': '系统看板',
    '/students': '学籍管理 / 学生列表',
    '/courses': '课程管理 / 课程分配体系',
    '/system-logs': '系统设置 / 操作日志',
    '/settings': '系统设置',
    '/admin-accounts': '账号管理 / 全部管理员'
  };

  const currentPathName = breadcrumbMap[location.pathname] || '仪表盘';

  // Click outside to close bell
  useEffect(() => {
    if (!bellOpen) return;
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [bellOpen]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch('/api/feedback/count', { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setPendingCount(data.pending || 0);
    } catch { /* ignore */ }
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/feedback', { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(data.data || []);
        setPendingCount(data.pending || 0);
      }
    } catch {
      setFeedbacks([]);
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async (limit = 20) => {
    setAlertLoading(true);
    try {
      const res = await fetch(`/api/system-logs?levels=error,crash&limit=${limit}`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setAlerts(data.data || []);
    } catch {
      setAlerts([]);
    } finally {
      setAlertLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  const handleBellClick = () => {
    const next = !bellOpen;
    setBellOpen(next);
    if (next) {
      if (bellTab === 'feedback') fetchFeedbacks();
      else fetchAlerts(20);
    }
  };

  const switchTab = (tab) => {
    setBellTab(tab);
    if (tab === 'feedback') fetchFeedbacks();
    else fetchAlerts(20);
  };

  const handleReply = async (fbId) => {
    const content = (replyContent[fbId] || '').trim();
    if (!content) return;
    setReplyingId(fbId);
    try {
      const res = await fetch(`/api/feedback/${fbId}/reply`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplyContent(prev => ({ ...prev, [fbId]: '' }));
        setFeedbacks(prev => prev.map(fb => fb.id === fbId ? data.data : fb));
        setPendingCount(c => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplyingId(null);
    }
  };

  const handleCloseFeedback = async (fbId) => {
    try {
      await fetch(`/api/feedback/${fbId}/close`, {
        method: 'PUT',
        headers: jsonHeaders(),
      });
      setFeedbacks(prev => prev.map(fb => fb.id === fbId ? { ...fb, status: 'closed' } : fb));
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('displayName');
    localStorage.removeItem('isAdmin');
    setCurrentUser?.({ role: '', username: '', name: '', isAdmin: false });
    setIsAuthenticated(false);
  };

  const totalBadge = pendingCount + alerts.length;

  return (
    <div className="app-shell admin-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <aside
        className="app-sidebar"
        style={{ 
          width: collapsed ? '80px' : '260px', 
          backgroundColor: 'var(--bg-surface)', 
          borderRight: '1px solid var(--border-color)',
          display: 'flex', 
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 50
        }}
      >
        <div className="app-brand" style={{
          height: '72px', 
          display: 'flex', 
          alignItems: 'center', 
          padding: collapsed ? '0 24px' : '0 24px', 
          borderBottom: '1px solid var(--border-color)',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          <div className="app-brand-badge" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
            OS
          </div>
          {!collapsed && (
            <div className="app-brand-copy">
              <span className="app-brand-name" style={{ marginLeft: '12px', fontSize: '1.2rem', fontWeight: 600, letterSpacing: 0 }}>Student OS</span>
              <span className="terminal-build">v2.4.1 // node_online</span>
            </div>
          )}
        </div>

        <button
          className="app-collapse-control"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute',
            right: '-14px',
            top: '22px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 60
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <nav className="app-nav" style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`app-nav-link${isActive ? ' is-active' : ''}`}
                data-terminal-index={String(index + 1).padStart(2, '0')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '12px',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none'
                }}
              >
                <Icon size={20} style={{ flexShrink: 0, color: isActive ? 'var(--primary)' : 'inherit' }} />
                {!collapsed && <span style={{ marginLeft: '16px', fontWeight: isActive ? 600 : 500 }}>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="app-session" style={{ padding: '24px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div className="app-session-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-highlight)' }}>
            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(username)}`} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </div>
          {!collapsed && (
            <div className="app-session-copy" style={{ flex: 1 }}>
              <div className="app-session-name" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{username}</div>
              <div className="app-session-status" style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span> Online
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <header className="app-topbar" style={{
          height: '72px', 
          padding: '0 32px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(18px) saturate(1.08)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div className="app-breadcrumb" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            <span className="terminal-prompt">root@student-os:~#</span>
            {currentPathName}
          </div>

          <div className="app-top-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }} ref={bellRef}>
              <button
                onClick={handleBellClick}
                title="通知中心"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: '6px' }}
              >
                <Bell size={20} />
                {totalBadge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '-1px',
                    minWidth: '16px',
                    height: '16px',
                    background: 'var(--danger)',
                    borderRadius: '8px',
                    border: '2px solid var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#fff',
                    padding: '0 3px',
                  }}>
                    {totalBadge > 99 ? '99+' : totalBadge}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '40px',
                    width: '420px',
                    maxHeight: '520px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 120,
                    overflow: 'hidden',
                    padding: 0,
                  }}
                >
                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <button
                      type="button"
                      onClick={() => switchTab('feedback')}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: bellTab === 'feedback' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: bellTab === 'feedback' ? 'var(--primary)' : 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: bellTab === 'feedback' ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <MessageSquare size={15} />
                      学生反馈
                      {pendingCount > 0 && (
                        <span style={{
                          background: 'var(--danger)',
                          color: '#fff',
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          minWidth: '18px',
                          textAlign: 'center',
                        }}>{pendingCount}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab('alerts')}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: bellTab === 'alerts' ? '2px solid var(--danger)' : '2px solid transparent',
                        color: bellTab === 'alerts' ? 'var(--danger)' : 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: bellTab === 'alerts' ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={15} />
                      系统告警
                      {alerts.length > 0 && (
                        <span style={{
                          background: alerts.length > 0 ? 'var(--danger)' : 'var(--text-dim)',
                          color: '#fff',
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          minWidth: '18px',
                          textAlign: 'center',
                        }}>{alerts.length}</span>
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {bellTab === 'feedback' ? (
                      feedbackLoading ? (
                        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
                      ) : feedbacks.length === 0 ? (
                        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无学生反馈</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {feedbacks.slice(0, 15).map((fb) => {
                            const typeCfg = TYPE_MAP[fb.type] || TYPE_MAP.feedback;
                            const statusCfg = STATUS_MAP[fb.status] || STATUS_MAP.pending;
                            const StatusIcon = statusCfg.icon;
                            const isExpanded = expandedFeedback === fb.id;
                            const hasNewReplies = fb.status === 'replied';

                            return (
                              <div
                                key={fb.id}
                                style={{
                                  borderRadius: '10px',
                                  border: `1px solid ${fb.status === 'pending' ? 'var(--warning)' : 'var(--border-color)'}`,
                                  background: fb.status === 'pending' ? 'rgba(245,158,11,0.04)' : 'rgba(237,241,246,0.03)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  onClick={() => setExpandedFeedback(isExpanded ? null : fb.id)}
                                  style={{ padding: '12px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                                >
                                  <div style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    marginTop: '7px', flexShrink: 0,
                                    background: fb.status === 'pending' ? 'var(--warning)' : fb.status === 'replied' ? 'var(--success)' : 'var(--text-dim)',
                                  }}></div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '3px', background: `${typeCfg.color}20`, color: typeCfg.color, fontWeight: 600 }}>{typeCfg.label}</span>
                                      <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '3px', background: 'var(--bg-elevated)', color: statusCfg.color, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <StatusIcon size={10} /> {statusCfg.label}
                                      </span>
                                      {hasNewReplies && (
                                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', background: 'var(--success)', color: '#fff', fontWeight: 600 }}>新回复</span>
                                      )}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{fb.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      <span>👤 {fb.student_name}</span>
                                      <span>🆔 {fb.student_id}</span>
                                      <span>🕐 {displayBeijingTime(fb.created_at)}</span>
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ padding: '10px 0', fontSize: '0.83rem', lineHeight: 1.6, color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                      {fb.content}
                                    </div>

                                    {/* Replies */}
                                    {fb.replies && fb.replies.length > 0 && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', marginBottom: '10px' }}>
                                        {fb.replies.map(reply => (
                                          <div key={reply.id} style={{
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            background: 'rgba(16,185,129,0.06)',
                                            borderLeft: '3px solid var(--success)',
                                          }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                              <span>管理员：{reply.admin_name || reply.admin_username}</span>
                                              <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>{displayBeijingTime(reply.created_at)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{reply.content}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Reply input */}
                                    {fb.status !== 'closed' && (
                                      <div style={{ marginTop: '8px' }}>
                                        <textarea
                                          ref={el => { replyInputRef.current[fb.id] = el; }}
                                          value={replyContent[fb.id] || ''}
                                          onChange={e => setReplyContent(prev => ({ ...prev, [fb.id]: e.target.value }))}
                                          placeholder="输入回复内容..."
                                          rows={2}
                                          style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-dark)',
                                            color: 'var(--text-main)',
                                            fontSize: '0.82rem',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            lineHeight: 1.5,
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                          }}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                              handleReply(fb.id);
                                            }
                                          }}
                                        />
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'flex-end' }}>
                                          {fb.status === 'replied' && (
                                            <button
                                              type="button"
                                              onClick={() => handleCloseFeedback(fb.id)}
                                              style={{
                                                padding: '5px 10px',
                                                fontSize: '0.75rem',
                                                background: 'transparent',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '5px',
                                                color: 'var(--text-dim)',
                                                cursor: 'pointer',
                                              }}
                                            >关闭</button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleReply(fb.id)}
                                            disabled={replyingId === fb.id || !(replyContent[fb.id] || '').trim()}
                                            className="btn-primary"
                                            style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                          >
                                            <Send size={12} /> {replyingId === fb.id ? '发送中...' : '回复'}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      alertLoading ? (
                        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
                      ) : alerts.length > 0 ? (
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {alerts.map((alert) => (
                            <div key={alert.id} style={{ padding: '12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                                <span className="badge badge-blue">{alert.level}</span>
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{displayBeijingTime(alert.created_at)}</span>
                              </div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{alert.message}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: '5px' }}>
                                {alert.category} · {alert.actor || 'system'} {alert.ip && `· ${alert.ip}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无系统告警</div>
                      )
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-color)', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {bellTab === 'feedback' && (
                      <button type="button" onClick={fetchFeedbacks} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <RefreshCw size={12} /> 刷新
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setBellOpen(false); navigate(bellTab === 'feedback' ? '/system-logs' : '/system-logs'); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
                    >
                      查看全部 →
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              className="app-logout-control"
              onClick={handleLogout}
              title="退出登录"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <span className="terminal-logout-label">[ LOGOUT ]</span>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="app-content" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
