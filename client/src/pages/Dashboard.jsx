import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, Activity, Cpu, RefreshCw } from 'lucide-react';
import { authHeaders } from '../api';
import { displayBeijingTime } from '../time';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, genderDistribution: [], majorDistribution: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
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
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAuditLogs();
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
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', textShadow: '0 0 20px var(--primary-glow)' }}>
            {stats.totalStudents.toLocaleString()}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, transform: 'rotate(-10deg)' }}><GraduationCap size={120} /></div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
            开设专业总数
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {stats.majorDistribution?.length || 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}><Activity size={120} /></div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></div>
            性别分布 - 男生
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {stats.genderDistribution?.find(g => g.gender === '男')?.count || 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}><Cpu size={120} /></div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }}></div>
            性别分布 - 女生
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {stats.genderDistribution?.find(g => g.gender === '女')?.count || 0}
          </div>
        </div>
      </div>

      {/* 图表与日志区域 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel fade-in-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600 }}>各专业学生分布</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.majorDistribution}>
                <XAxis dataKey="major" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'var(--control-surface-hover)'}} contentStyle={{background: 'var(--bg-surface-solid)', color: 'var(--text-main)', border: '1px solid var(--border-highlight)', borderRadius: '8px'}} />
                <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel fade-in-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '360px' }}>
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>系统日志</h3>
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
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '4px', lineHeight: 1.55 }}>
                    <div>{log.category} · {log.actor || 'system'}</div>
                    <div>{displayBeijingTime(log.created_at)}</div>
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
  );
};

export default Dashboard;
