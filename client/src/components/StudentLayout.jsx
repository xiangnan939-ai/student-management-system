import { useEffect, useState, useCallback, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Bell,
  Send,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  CheckCircle,
  Clock,
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
  closed: { label: '已处理', icon: CheckCircle, color: 'var(--text-dim)' },
};

const StudentLayout = ({ setIsAuthenticated, currentUser, setCurrentUser }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellTab, setBellTab] = useState('send');
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [expandedFb, setExpandedFb] = useState(null);

  // Form state
  const [fbType, setFbType] = useState('feedback');
  const [fbTitle, setFbTitle] = useState('');
  const [fbContent, setFbContent] = useState('');

  const bellRef = useRef(null);
  const username = currentUser?.name || currentUser?.username || localStorage.getItem('displayName') || '学生';

  const navItems = [
    { path: '/student/course-selection', name: '选课管理', icon: BookOpenCheck },
    { path: '/student/settings', name: '系统设置', icon: Settings },
  ];

  const breadcrumbMap = {
    '/student/course-selection': '选课管理',
    '/student/settings': '系统设置',
  };

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

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/feedback/count', { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setUnreadCount(data.unread || 0);
    } catch { /* ignore */ }
  }, []);

  const fetchMyFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feedback/my', { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(data.data || []);
        setUnreadCount(data.unread || 0);
      }
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleBellClick = () => {
    const next = !bellOpen;
    setBellOpen(next);
    setSubmitMsg('');
    if (next) {
      if (bellTab === 'my') fetchMyFeedbacks();
    }
  };

  const switchTab = (tab) => {
    setBellTab(tab);
    setSubmitMsg('');
    if (tab === 'my') fetchMyFeedbacks();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fbTitle.trim() || !fbContent.trim()) return;
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ type: fbType, title: fbTitle.trim(), content: fbContent.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMsg('✅ 反馈已发送，管理员会尽快回复');
        setFbTitle('');
        setFbContent('');
        setFbType('feedback');
        fetchUnread();
      } else {
        setSubmitMsg('❌ ' + (data.error || '发送失败'));
      }
    } catch {
      setSubmitMsg('❌ 网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (fbId) => {
    try {
      await fetch(`/api/feedback/my/${fbId}/read`, {
        method: 'PUT',
        headers: jsonHeaders(),
      });
      setFeedbacks(prev => prev.map(fb => fb.id === fbId ? { ...fb, status: 'closed' } : fb));
      setUnreadCount(c => Math.max(0, c - 1));
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

  return (
    <div className="app-shell student-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <aside
        className="app-sidebar"
        style={{
          width: collapsed ? '80px' : '240px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 50,
        }}
      >
        <div className="app-brand" style={{ height: '72px', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid var(--border-color)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div className="app-brand-badge" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--success), var(--primary))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
            S
          </div>
          {!collapsed && (
            <div className="app-brand-copy">
              <span className="app-brand-name" style={{ marginLeft: '12px', fontSize: '1.1rem', fontWeight: 600 }}>学生端</span>
              <span className="terminal-build">student_session // linked</span>
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
            zIndex: 60,
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
                  background: isActive ? 'var(--success-glow)' : 'transparent',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={20} style={{ flexShrink: 0, color: isActive ? 'var(--success)' : 'inherit' }} />
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
              <div className="app-session-status" style={{ fontSize: '0.75rem', color: 'var(--success)' }}>学生在线</div>
            </div>
          )}
        </div>
      </aside>

      <main className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <header className="app-topbar" style={{ height: '72px', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)', backdropFilter: 'blur(18px) saturate(1.08)', position: 'sticky', top: 0, zIndex: 40 }}>
          <div className="app-breadcrumb" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}><span className="terminal-prompt">student@student-os:~$</span>{breadcrumbMap[location.pathname] || '学生端'}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Feedback Bell */}
            <div style={{ position: 'relative' }} ref={bellRef}>
              <button
                onClick={handleBellClick}
                title="反馈与通知"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: '6px' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '-1px',
                    minWidth: '16px',
                    height: '16px',
                    background: 'var(--success)',
                    borderRadius: '8px',
                    border: '2px solid var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#fff',
                    padding: '0 3px',
                  }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {bellOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '40px',
                    width: '400px',
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
                      onClick={() => switchTab('send')}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: bellTab === 'send' ? '2px solid var(--success)' : '2px solid transparent',
                        color: bellTab === 'send' ? 'var(--success)' : 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: bellTab === 'send' ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <PlusCircle size={15} /> 发送反馈
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab('my')}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: bellTab === 'my' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: bellTab === 'my' ? 'var(--primary)' : 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: bellTab === 'my' ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <MessageSquare size={15} /> 我的反馈
                      {unreadCount > 0 && (
                        <span style={{
                          background: 'var(--success)',
                          color: '#fff',
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          minWidth: '18px',
                          textAlign: 'center',
                        }}>{unreadCount}</span>
                      )}
                    </button>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
                    {bellTab === 'send' ? (
                      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {submitMsg && (
                          <div style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            background: submitMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: submitMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${submitMsg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          }}>{submitMsg}</div>
                        )}

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>反馈类型</label>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {Object.entries(TYPE_MAP).map(([key, cfg]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setFbType(key)}
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '0.78rem',
                                  borderRadius: '6px',
                                  border: `1px solid ${fbType === key ? cfg.color : 'var(--border-color)'}`,
                                  background: fbType === key ? `${cfg.color}20` : 'var(--bg-elevated)',
                                  color: fbType === key ? cfg.color : 'var(--text-dim)',
                                  cursor: 'pointer',
                                  fontWeight: fbType === key ? 600 : 400,
                                }}
                              >{cfg.label}</button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>标题</label>
                          <input
                            type="text"
                            value={fbTitle}
                            onChange={e => setFbTitle(e.target.value)}
                            placeholder="简要描述你的问题或建议..."
                            maxLength={100}
                            className="input-field"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>详细内容</label>
                          <textarea
                            value={fbContent}
                            onChange={e => setFbContent(e.target.value)}
                            placeholder="详细描述你遇到的问题、疑问或建议..."
                            rows={5}
                            maxLength={2000}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-dark)',
                              color: 'var(--text-main)',
                              fontSize: '0.85rem',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              lineHeight: 1.6,
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'right', marginTop: '4px' }}>
                            {fbContent.length}/2000
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={submitting || !fbTitle.trim() || !fbContent.trim()}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
                        >
                          <Send size={16} /> {submitting ? '发送中...' : '发送反馈'}
                        </button>
                      </form>
                    ) : (
                      loading ? (
                        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
                      ) : feedbacks.length === 0 ? (
                        <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>你还没有提交过反馈</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <button type="button" onClick={fetchMyFeedbacks} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <RefreshCw size={12} /> 刷新
                            </button>
                          </div>
                          {feedbacks.map(fb => {
                            const typeCfg = TYPE_MAP[fb.type] || TYPE_MAP.feedback;
                            const statusCfg = STATUS_MAP[fb.status] || STATUS_MAP.pending;
                            const StatusIcon = statusCfg.icon;
                            const isExpanded = expandedFb === fb.id;
                            const hasUnreadReply = fb.status === 'replied';

                            return (
                              <div
                                key={fb.id}
                                style={{
                                  borderRadius: '10px',
                                  border: `1px solid ${hasUnreadReply ? 'var(--success)' : 'var(--border-color)'}`,
                                  background: hasUnreadReply ? 'rgba(16,185,129,0.04)' : 'rgba(237,241,246,0.03)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  onClick={() => setExpandedFb(isExpanded ? null : fb.id)}
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
                                      {hasUnreadReply && (
                                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', background: 'var(--success)', color: '#fff', fontWeight: 600 }}>新回复</span>
                                      )}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{fb.title}</div>
                                    <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '4px' }}>{displayBeijingTime(fb.created_at)}</div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ padding: '10px 0', fontSize: '0.83rem', lineHeight: 1.6, color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                      {fb.content}
                                    </div>

                                    {fb.replies && fb.replies.length > 0 && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', marginBottom: hasUnreadReply ? '10px' : '0' }}>
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

                                    {hasUnreadReply && (
                                      <button
                                        type="button"
                                        onClick={() => handleMarkRead(fb.id)}
                                        className="btn-primary"
                                        style={{ padding: '5px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <CheckCircle size={12} /> 已读
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="app-logout-control" onClick={handleLogout} title="退出登录" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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

export default StudentLayout;
