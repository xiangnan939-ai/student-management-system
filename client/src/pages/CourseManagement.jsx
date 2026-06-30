import { Book, Code, Network, Database, Brain, Globe, Cpu } from 'lucide-react';

const CourseManagement = () => {
  const courses = [
    { name: '计算机组成原理与系统结构', credits: 4, type: '专业核心课', icon: Cpu, color: '#3b82f6', percent: 85 },
    { name: '操作系统与并发控制 (课设)', credits: 3, type: '实践必修课', icon: Network, color: '#10b981', percent: 100 },
    { name: '数据结构与算法进阶', credits: 4, type: '专业核心课', icon: Code, color: '#8b5cf6', percent: 65 },
    { name: '大型数据库系统原理', credits: 3.5, type: '专业选修课', icon: Database, color: '#f59e0b', percent: 40 },
    { name: '人工智能引论', credits: 2, type: '通识拓展课', icon: Brain, color: '#ef4444', percent: 20 },
    { name: 'Web 全栈工程化实践', credits: 3, type: '实践选修课', icon: Globe, color: '#06b6d4', percent: 75 },
  ];

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>课程管理体系 (演示模块)</h1>
        <p style={{ color: 'var(--text-muted)' }}>全校开课计划与教学进度拓扑矩阵</p>
      </div>

      <div className="glass-panel" style={{ padding: '24px', minHeight: '400px' }}>
        <h3 style={{ marginBottom: '24px' }}>本学期活跃课程池</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {courses.map((c, i) => {
            const Icon = c.icon || Book;
            return (
              <div key={i} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px', 
                padding: '20px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: `${c.color}20`, color: c.color, borderRadius: '10px' }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{c.name}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}>{c.credits} 学分</span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}>{c.type}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>教学进度</span>
                    <span>{c.percent}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.percent}%`, background: c.color, borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
