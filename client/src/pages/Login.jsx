import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

const Login = ({ setIsAuthenticated, setCurrentUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('displayName', data.user.name || data.user.username);
        localStorage.setItem('isAdmin', data.user.isAdmin ? 'true' : 'false');
        setCurrentUser?.(data.user);
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('连接错误: ' + err.message);
    } finally {
      setLoading(false);
    }
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
        borderRight: '1px solid var(--border-color)'
      }}>
        {/* 背景光晕装饰 */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'var(--primary-glow)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'var(--accent-glow)', filter: 'blur(120px)', borderRadius: '50%' }}></div>
        
        <div className="fade-in-up" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--border-highlight)' }}>
              <Cpu size={40} color="var(--primary)" />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
            <p style={{ color: 'var(--text-dim)' }}>请输入您的管理员凭证</p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>用户名</label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '12px', padding: '14px' }}>
              {loading ? '正在验证...' : '安全登录'} <ArrowRight size={18} />
            </button>
          </form>
          
          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            <p>本系统仅供授权的高校教职工使用</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
