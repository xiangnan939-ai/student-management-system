import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  BookOpen, 
  BarChart3, 
  Settings,
  Shield,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Layout = ({ setIsAuthenticated, currentUser, setCurrentUser }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const username = currentUser?.username || localStorage.getItem('username') || '管理员';
  const isAdmin = username === 'admin';

  const navItems = [
    { path: '/dashboard', name: '系统看板', icon: LayoutDashboard },
    { path: '/students', name: '学籍管理', icon: Users },
    { path: '/courses', name: '课程管理', icon: BookOpen },
    { path: '/grades', name: '成绩分析', icon: BarChart3 },
    { path: '/settings', name: '系统设置', icon: Settings },
    ...(isAdmin ? [{ path: '/admin-accounts', name: '账号管理', icon: Shield }] : []),
  ];

  // 面包屑名称映射
  const breadcrumbMap = {
    '/dashboard': '系统看板',
    '/students': '学籍管理 / 学生列表',
    '/courses': '课程管理 / 课程分配体系',
    '/grades': '成绩分析 / 高阶图表',
    '/settings': '系统设置 / 账号安全',
    '/admin-accounts': '账号管理 / 全部管理员'
  };

  const currentPathName = breadcrumbMap[location.pathname] || '仪表盘';

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
      {/* 高级侧边栏 */}
      <aside 
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
        {/* Logo 区域 */}
        <div style={{ 
          height: '72px', 
          display: 'flex', 
          alignItems: 'center', 
          padding: collapsed ? '0 24px' : '0 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
            OS
          </div>
          {!collapsed && (
            <span style={{ marginLeft: '12px', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
              Student OS
            </span>
          )}
        </div>

        {/* 折叠按钮 */}
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
            zIndex: 60
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* 导航菜单 */}
        <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(item => {
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
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? 'inset 0 0 10px rgba(59, 130, 246, 0.1)' : 'none'
                }}
              >
                <Icon size={20} style={{ flexShrink: 0, color: isActive ? 'var(--primary)' : 'inherit' }} />
                {!collapsed && <span style={{ marginLeft: '16px', fontWeight: isActive ? 600 : 500 }}>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* 底部用户信息 */}
        <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-highlight)' }}>
            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(username)}`} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </div>
          {!collapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{username}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span> Online
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        
        {/* 顶部状态栏 (Top App Bar) */}
        <header style={{ 
          height: '72px', 
          padding: '0 32px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(9, 9, 11, 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* 面包屑 */}
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            {currentPathName}
          </div>

          {/* 右侧工具栏 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="全局搜索 (Ctrl+K)" 
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  padding: '8px 16px 8px 36px',
                  borderRadius: '99px',
                  fontSize: '0.85rem',
                  width: '240px',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'var(--border-highlight)'; }}
                onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.borderColor = 'var(--border-color)'; }}
              />
            </div>
            
            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'relative' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-dark)' }}></span>
            </button>
            <button
              onClick={handleLogout}
              title="退出登录"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={20} />
            </button>
            

          </div>
        </header>

        {/* 路由视图容器 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
