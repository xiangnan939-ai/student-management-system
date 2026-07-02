import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

const Login = ({ setIsAuthenticated, setCurrentUser }) => {
  const [loginType, setLoginType] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const navigate = useNavigate();
  const lockSeconds = lockedUntil ? Math.max(Math.ceil((lockedUntil - now) / 1000), 0) : 0;

  useEffect(() => {
    if (!lockedUntil) return undefined;

    const timer = window.setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);
      if (lockedUntil <= nextNow) {
        setLockedUntil(0);
        setError('');
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(loginType === 'student' ? '/api/student/login' : '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setLockedUntil(0);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role || loginType);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('displayName', data.user.name || data.user.username);
        localStorage.setItem('isAdmin', data.user.isAdmin ? 'true' : 'false');
        setCurrentUser?.({ ...data.user, role: data.user.role || loginType, isAdmin: data.user.isAdmin || false });
        setIsAuthenticated(true);
        navigate((data.user.role || loginType) === 'student' ? '/student/course-selection' : '/dashboard');
      } else {
        setError(data.message);
        if (data.locked && data.lockedUntil) {
          setNow(Date.now());
          setLockedUntil(Number(data.lockedUntil));
        }
      }
    } catch (err) {
      setError('连接错误: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchLoginType = (type) => {
    setLoginType(type);
    setUsername('');
    setPassword('');
    setError('');
    setLockedUntil(0);
  };

  const handleUsernameChange = (value) => {
    setUsername(value);
    setError('');
    setLockedUntil(0);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      {/* 左侧：品牌展示区 (抽象动态效果) */}
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '60px',
        borderRight: '1px solid var(--border-color)',
        background: 'linear-gradient(135deg, rgba(143, 183, 232, 0.075), transparent 42%), linear-gradient(315deg, rgba(213, 189, 138, 0.07), transparent 38%)'
      }}>
        {/* 背景光晕装饰 */}
        <div style={{ position: 'absolute', top: '-18%', left: '-18%', width: '620px', height: '620px', background: 'var(--primary-glow)', filter: 'blur(120px)', borderRadius: '50%', opacity: 0.55 }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '-18%', width: '720px', height: '720px', background: 'var(--accent-glow)', filter: 'blur(140px)', borderRadius: '50%', opacity: 0.5 }}></div>
        
        <div className="fade-in-up" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
            <div style={{ padding: '16px', background: 'rgba(237,241,246,0.055)', borderRadius: '14px', border: '1px solid var(--border-highlight)' }}>
              <Cpu size={40} color="var(--primary)" />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: 0, background: 'linear-gradient(to right, #edf1f6, #a2acba)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Student OS <br /> Enterprise
            </h1>
          </div>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: '500px' }}>
            “新一代高校教务管理中枢。”<br/>
            依托底层真实多线程并发控制架构，提供千万级数据吞吐能力的高保真管理面板。
          </p>
        </div>
      </div>

      {/* 右侧：极简高级表单区 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div className="glass-panel fade-in-up delay-100" style={{ padding: '48px', width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '8px' }}>欢迎回来</h2>
            <p style={{ color: 'var(--text-dim)' }}>{loginType === 'student' ? '请输入学号和密码' : '请输入您的管理员凭证'}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '4px', background: 'rgba(237,241,246,0.04)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => switchLoginType('student')}
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                color: loginType === 'student' ? '#071019' : 'var(--text-muted)',
                background: loginType === 'student' ? 'linear-gradient(135deg, var(--success), #75b69c)' : 'transparent',
                fontWeight: 600,
              }}
            >
              学生登录
            </button>
            <button
              type="button"
              onClick={() => switchLoginType('admin')}
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                color: loginType === 'admin' ? '#071019' : 'var(--text-muted)',
                background: loginType === 'admin' ? 'linear-gradient(135deg, var(--primary), #6f95c4)' : 'transparent',
                fontWeight: 600,
              }}
            >
              管理员登录
            </button>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                {loginType === 'student' ? '学号' : '用户名'}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder={loginType === 'student' ? '请输入学号' : '请输入账号'}
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>密码</label>
              <input
                type="password"
                className="input-field"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '0.9rem', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <ShieldCheck size={18} /> {error}
              </div>
            )}
            
            <button type="submit" className="btn-primary" disabled={loading || lockSeconds > 0} style={{ marginTop: '12px', padding: '14px' }}>
              {loading ? '正在验证...' : lockSeconds > 0 ? `请等待 ${lockSeconds} 秒` : loginType === 'student' ? '进入学生端' : '安全登录'} <ArrowRight size={18} />
            </button>
          </form>
          
          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            <p>{loginType === 'student' ? '学生默认密码为 123456' : '本系统仅供授权的高校教职工使用'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
