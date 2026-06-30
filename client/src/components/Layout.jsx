import { useEffect, useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { authHeaders } from '../api';

const Layout = ({ setIsAuthenticated, currentUser, setCurrentUser }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
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

  const fetchAlerts = async (limit = 20) => {
    setAlertLoading(true);

    try {
      const response = await fetch(`/api/system-logs?levels=error,crash&limit=${limit}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '系统告警读取失败');
      setAlerts(data.data || []);
    } catch (error) {
      setAlerts([{
        id: 'local-alert-error',
        level: 'error',
        category: 'client',
        message: error.message,
        detail: '',
        actor: 'browser',
        created_at: new Date().toLocaleString(),
      }]);
    } finally {
      setAlertLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialAlerts = async () => {
      try {
        const response = await fetch('/api/system-logs?levels=error,crash&limit=1', {
          headers: authHeaders(),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '系统告警读取失败');
        if (!ignore) setAlerts(data.data || []);
      } catch {
        if (!ignore) setAlerts([]);
      }
    };

    loadInitialAlerts();

    return () => {
      ignore = true;
    };
  }, []);

  const handleBellClick = () => {
    const nextOpen = !alertOpen;
    setAlertOpen(nextOpen);
    if (nextOpen) fetchAlerts(20);
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
            <span style={{ marginLeft: '12px', fontSize: '1.2rem', fontWeight: 600, letterSpacing: 0 }}>
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
                  background: isActive ? 'rgba(143, 183, 232, 0.13)' : 'transparent',
                  border: isActive ? '1px solid rgba(143, 183, 232, 0.24)' : '1px solid transparent',
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
          background: 'rgba(11, 13, 18, 0.78)',
          backdropFilter: 'blur(18px) saturate(1.08)',
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
              <button
                onClick={handleBellClick}
                title="系统报错和崩溃记录"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
              >
                <Bell size={20} />
                {alerts.length > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-dark)' }}></span>
                )}
              </button>

              {alertOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '34px',
                    width: '380px',
                    maxHeight: '460px',
                    overflowY: 'auto',
                    padding: '16px',
                    zIndex: 120,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 650 }}>系统报错与崩溃记录</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '2px' }}>来自系统日志数据库</div>
                    </div>
                    <button type="button" className="btn-secondary" onClick={() => fetchAlerts(20)} style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
                      刷新
                    </button>
                  </div>

                  {alertLoading ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>读取中...</div>
                  ) : alerts.length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {alerts.map((alert) => (
                        <div key={alert.id} style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'rgba(237,241,246,0.035)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                            <span className={`badge ${alert.level === 'crash' ? 'badge-orange' : 'badge-blue'}`}>{alert.level}</span>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{alert.created_at}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{alert.message}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '5px' }}>
                            {alert.category} · {alert.actor || 'system'}
                          </div>
                          {alert.detail && (
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.76rem', marginTop: '8px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                              {alert.detail}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      暂无报错或崩溃记录
                    </div>
                  )}
                </div>
              )}
            </div>
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
