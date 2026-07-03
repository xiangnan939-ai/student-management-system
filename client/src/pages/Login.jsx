import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import { normalizeTheme } from '../themes';
import loginBackdrop from '../assets/login-ambient-bg.jpg';

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
        const theme = normalizeTheme(data.user.theme);
        localStorage.setItem('theme', theme);
        setCurrentUser?.({ ...data.user, role: data.user.role || loginType, theme, isAdmin: data.user.isAdmin || false });
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
    <div className="login-shell" style={{ '--login-bg-image': `url(${loginBackdrop})` }}>
      <div className="login-flow-field" aria-hidden="true"></div>
      <div className="login-backdrop-image login-backdrop-image-luminosity" aria-hidden="true"></div>
      <div className="login-backdrop-image login-backdrop-image-detail" aria-hidden="true"></div>
      <div className="login-vignette" aria-hidden="true"></div>

      <section className="login-visual-space" aria-label="系统视觉背景">
        <div className="login-brand-mark fade-in-up">
          <span className="login-brand-icon"><Cpu size={26} /></span>
          <span>
            <strong>Student OS</strong>
            <small>最好的学生管理系统</small>
          </span>
        </div>
      </section>

      <section className="login-form-stage">
        <div className="login-auth-card fade-in-up delay-100">
          <div className="login-card-heading">
            <span className="login-card-kicker">Secure Access</span>
            <h2>欢迎回来</h2>
            <p>{loginType === 'student' ? '请输入学号和密码' : '请输入您的管理员凭证'}</p>
          </div>

          <div className="login-type-switch">
            <button
              type="button"
              onClick={() => switchLoginType('student')}
              className={loginType === 'student' ? 'active student' : ''}
            >
              学生登录
            </button>
            <button
              type="button"
              onClick={() => switchLoginType('admin')}
              className={loginType === 'admin' ? 'active admin' : ''}
            >
              管理员登录
            </button>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div>
              <label className="login-field-label">
                {loginType === 'student' ? '学号' : '用户名'}
              </label>
              <input
                type="text"
                className="login-input"
                placeholder={loginType === 'student' ? '请输入学号' : '请输入账号'}
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="login-field-label">密码</label>
              <input
                type="password"
                className="login-input"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="login-error">
                <ShieldCheck size={18} /> {error}
              </div>
            )}
            
            <button type="submit" className="login-submit" disabled={loading || lockSeconds > 0}>
              {loading ? '正在验证...' : lockSeconds > 0 ? `请等待 ${lockSeconds} 秒` : loginType === 'student' ? '进入学生端' : '安全登录'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Login;
