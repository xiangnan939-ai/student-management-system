import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, CartesianGrid } from 'recharts';
import { Users, GraduationCap, Activity, Cpu, RefreshCw } from 'lucide-react';
import { authHeaders } from '../api';

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

const Dashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, genderDistribution: [], majorDistribution: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(true);

  const fetchStats = () => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  };

  const fetchAuditLogs = async () => {
    setLogLoading(true);

    try {
      const response = await fetch('/api/system-logs?limit=8', { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '系统日志读取失败');
      setAuditLogs(data.data || []);
    } catch (error) {
      setAuditLogs([{
        id: 'dashboard-log-error',
        level: 'error',
        message: error.message,
        category: 'client',
        actor: 'browser',
        created_at: new Date().toLocaleString(),
      }]);
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadAuditLogs = async () => {
      try {
        const response = await fetch('/api/system-logs?limit=8', { headers: authHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '系统日志读取失败');
        if (!ignore) setAuditLogs(data.data || []);
      } catch (error) {
        if (!ignore) {
          setAuditLogs([{
            id: 'dashboard-log-error',
            level: 'error',
            message: error.message,
            category: 'client',
            actor: 'browser',
            created_at: new Date().toLocaleString(),
          }]);
        }
      } finally {
        if (!ignore) setLogLoading(false);
      }
    };

    fetchStats();
    loadAuditLogs();

    return () => {
      ignore = true;
    };
  }, []);

  const logColor = (level) => {
    if (level === 'error' || level === 'crash') return 'var(--danger)';
    if (level === 'warning') return 'var(--warning)';
    if (level === 'success') return 'var(--success)';
    return 'var(--primary)';
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
            近期日志事件
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>
            {auditLogs.length}
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            近期真实系统日志
          </div>
        </div>
      </div>

      {/* 两列布局：图表区 + 日志区 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* 左侧大区域：图表分析 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', height: '430px' }}>
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

          <div className="glass-panel fade-in-up delay-300" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '360px' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>系统操作审计日志</h3>
              <button type="button" className="btn-secondary" onClick={fetchAuditLogs} disabled={logLoading} style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
                <RefreshCw size={14} /> 刷新
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', paddingRight: '4px' }}>
              {logLoading ? (
                <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)' }}>系统日志读取中...</div>
              ) : auditLogs.length > 0 ? auditLogs.map((log, idx) => (
                <div key={log.id || idx} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: '10px', height: '10px', borderRadius: '50%', marginTop: '6px',
                      background: logColor(log.level)
                    }}></div>
                    {idx !== auditLogs.length - 1 && <div style={{ flex: 1, width: '2px', background: 'var(--border-color)', marginTop: '4px' }}></div>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 560 }}>{log.message}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '4px' }}>
                      {log.category} · {log.actor || 'system'} · {log.created_at}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)' }}>暂无系统日志</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
