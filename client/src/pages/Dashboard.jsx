import { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, CartesianGrid } from 'recharts';
import { Users, GraduationCap, Activity, Cpu, Play, TerminalSquare } from 'lucide-react';
import { jsonHeaders } from '../api';

// 模拟雷达图数据
const mockRadarData = [
  { subject: '工科基础', A: 120, fullMark: 150 },
  { subject: '逻辑算法', A: 98, fullMark: 150 },
  { subject: '外语水平', A: 86, fullMark: 150 },
  { subject: '文史素养', A: 99, fullMark: 150 },
  { subject: '实践能力', A: 85, fullMark: 150 },
  { subject: '创新维度', A: 65, fullMark: 150 },
];

// 模拟招生趋势数据
const mockTrendData = [
  { year: '2020', count: 4000 },
  { year: '2021', count: 4300 },
  { year: '2022', count: 4800 },
  { year: '2023', count: 4600 },
  { year: '2024', count: 5200 },
  { year: '2025', count: 5900 },
];

// 模拟系统日志
const mockActivities = [
  { time: '10分钟前', msg: 'Admin 导出了全体学生名册', type: 'info' },
  { time: '1小时前', msg: '系统自动备份完成 (1.2GB)', type: 'success' },
  { time: '2小时前', msg: '检测到一次失败的异地登录尝试', type: 'warning' },
  { time: '昨天', msg: '导入了 300 名新生数据', type: 'info' },
];

const Dashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, genderDistribution: [], majorDistribution: [] });
  const [logs, setLogs] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const logsEndRef = useRef(null);

  const fetchStats = () => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startConcurrentTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setLogs([{ threadName: 'System', action: 'info', message: '>> INITIATING MULTI-THREADED SYNC SEQUENCE...', timestamp: new Date().toLocaleTimeString() }]);

    try {
      const response = await fetch('/api/start-concurrent-test', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ useMutex: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '并发测试启动失败');

      const returnedLogs = data.logs || [];
      returnedLogs.forEach((entry, index) => {
        setTimeout(() => {
          setLogs((prev) => [...prev, entry]);
          if (index === returnedLogs.length - 1) {
            fetchStats();
            setIsTesting(false);
          }
        }, index * 70);
      });
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, {
        threadName: 'System',
        action: 'error',
        message: err.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setIsTesting(false);
    }
  };

  const getLogColor = (action, threadName) => {
    if (action === 'error') return '#ff5c5c';
    if (action === 'lock') return '#50fa7b'; // 绿
    if (action === 'unlock') return '#ffb86c'; // 橙
    if (action === 'wait') return '#bd93f9'; // 紫
    if (threadName === 'System') return '#8be9fd'; // 青
    return '#f8f8f2';
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 顶部数据卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, transform: 'rotate(15deg)' }}><Users size={120} /></div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
            全校在籍学生总数
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', textShadow: '0 0 20px var(--primary-glow)' }}>
            {stats.totalStudents.toLocaleString()}
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--success)' }}>↑ 较上学期增长 4.2%</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, transform: 'rotate(-10deg)' }}><GraduationCap size={120} /></div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
            开设专业总数
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>
            {stats.majorDistribution?.length || 0}
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>覆盖 6 大学科门类</div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}><Activity size={120} /></div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></div>
            集群系统负载
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>
            12<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>节点健康度: Excellent</div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}><Cpu size={120} /></div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }}></div>
            活跃 Worker 线程
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>
            {isTesting ? 3 : 0}
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: isTesting ? 'var(--warning)' : 'var(--text-dim)' }}>
            {isTesting ? '并发同步进行中' : '等待任务调度'}
          </div>
        </div>
      </div>

      {/* 两列布局：图表区 + 控制台 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* 左侧大区域：图表分析 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 终端模拟器：多线程并发控制台 */}
          <div className="terminal-window fade-in-up delay-100">
            <div className="terminal-header">
              <div style={{ display: 'flex', gap: '6px' }}>
                <div className="terminal-dot" style={{ background: '#ff5f56' }}></div>
                <div className="terminal-dot" style={{ background: '#ffbd2e' }}></div>
                <div className="terminal-dot" style={{ background: '#27c93f' }}></div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '1px' }}>
                <TerminalSquare size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> 
                root@student-os: /var/log/concurrency.log
              </div>
              <button 
                className="btn-primary" 
                onClick={startConcurrentTest} 
                disabled={isTesting}
                style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
              >
                <Play size={14} /> {isTesting ? 'EXECUTING...' : 'RUN SYNC'}
              </button>
            </div>
            
            <div style={{ padding: '20px', height: '280px', overflowY: 'auto', background: '#0d1117' }}>
              {logs.length === 0 && (
                <div style={{ color: '#8b949e', fontStyle: 'italic' }}>
                  $ 等待触发多线程并发事务... <br/>
                  $ 提示：点击右上角 RUN SYNC 启动 Node.js 原生 worker_threads 压力测试。
                </div>
              )}
              {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px', lineHeight: 1.4 }}>
                  <span style={{ color: '#484f58', marginRight: '12px' }}>[{log.timestamp}]</span>
                  <span style={{ color: getLogColor(log.action, log.threadName) }}>
                    {log.threadName !== 'System' && <span style={{ fontWeight: 'bold' }}>[{log.threadName}] </span>}
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', height: '350px' }}>
            <div className="glass-panel fade-in-up delay-200" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600 }}>历年招生趋势分析</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="year" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{background: 'rgba(24, 24, 27, 0.9)', border: '1px solid var(--border-highlight)', borderRadius: '8px'}} />
                  <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{r: 4, fill: 'var(--bg-dark)', strokeWidth: 2}} activeDot={{r: 6, fill: 'var(--primary)'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel fade-in-up delay-200" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600 }}>各专业学生分布</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.majorDistribution}>
                  <XAxis dataKey="major" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: 'rgba(24, 24, 27, 0.9)', border: '1px solid var(--border-highlight)', borderRadius: '8px'}} />
                  <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 右侧区域：辅助图表与信息轴 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel fade-in-up delay-300" style={{ padding: '24px', height: '320px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1.1rem', fontWeight: 600 }}>全校生源综合能力画像</h3>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockRadarData}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Radar name="全校平均" dataKey="A" stroke="var(--success)" fill="var(--success)" fillOpacity={0.3} />
                <Tooltip contentStyle={{background: 'rgba(24, 24, 27, 0.9)', border: '1px solid var(--border-highlight)', borderRadius: '8px'}} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel fade-in-up delay-300" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600 }}>系统操作审计日志</h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mockActivities.map((act, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: '10px', height: '10px', borderRadius: '50%', marginTop: '6px',
                      background: act.type === 'success' ? 'var(--success)' : act.type === 'warning' ? 'var(--warning)' : 'var(--primary)'
                    }}></div>
                    {idx !== mockActivities.length - 1 && <div style={{ flex: 1, width: '2px', background: 'var(--border-color)', marginTop: '4px' }}></div>}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{act.msg}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '4px' }}>{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-secondary" style={{ marginTop: 'auto', width: '100%' }}>查看完整审计日志</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
