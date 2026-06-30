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
    '/student/settings': '系统设置 / 修改密码',
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <aside
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
        <div style={{ height: '72px', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--success), var(--primary))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
            S
          </div>
          {!collapsed && <span style={{ marginLeft: '12px', fontSize: '1.1rem', fontWeight: 600 }}>学生端</span>}
        </div>

        <button
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

        <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '12px',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
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

        <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-highlight)' }}>
            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(username)}`} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </div>
          {!collapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{username}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>学生在线</div>
            </div>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <header style={{ height: '72px', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', background: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>{breadcrumbMap[location.pathname] || '学生端'}</div>
          <button onClick={handleLogout} title="退出登录" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <LogOut size={20} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
