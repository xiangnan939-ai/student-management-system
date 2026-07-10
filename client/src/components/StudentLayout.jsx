import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpenCheck, ChevronLeft, ChevronRight, LogOut, Settings } from 'lucide-react';

const StudentLayout = ({ setIsAuthenticated, currentUser, setCurrentUser }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const username = currentUser?.name || currentUser?.username || localStorage.getItem('displayName') || '学生';

  const navItems = [
    { path: '/student/course-selection', name: '选课管理', icon: BookOpenCheck },
    { path: '/student/settings', name: '系统设置', icon: Settings },
  ];

  const breadcrumbMap = {
    '/student/course-selection': '选课管理',
    '/student/settings': '系统设置',
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
          <button className="app-logout-control" onClick={handleLogout} title="退出登录" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span className="terminal-logout-label">[ LOGOUT ]</span>
            <LogOut size={20} />
          </button>
        </header>

        <div className="app-content" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
