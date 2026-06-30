import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GradeAnalysis = () => {
  const data = [
    { name: '第一周', score: 65, avg: 60 },
    { name: '第三周', score: 72, avg: 65 },
    { name: '第五周', score: 85, avg: 70 },
    { name: '期中考', score: 81, avg: 68 },
    { name: '第十周', score: 89, avg: 72 },
    { name: '第十二周', score: 92, avg: 75 },
    { name: '期末考', score: 95, avg: 76 },
  ];

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>成绩与学情分析引擎 (演示模块)</h1>
        <p style={{ color: 'var(--text-muted)' }}>全链路学业水平追踪与多维数据挖掘</p>
      </div>

      <div className="glass-panel" style={{ padding: '32px', height: '500px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '24px' }}>计算机专业 (2024级) 综合学情走向</h3>
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <Tooltip contentStyle={{background: 'rgba(24, 24, 27, 0.9)', border: '1px solid var(--border-highlight)', borderRadius: '8px'}} />
              <Area type="monotone" dataKey="score" name="优秀梯队平均分" stroke="var(--primary)" fillOpacity={1} fill="url(#colorScore)" />
              <Area type="monotone" dataKey="avg" name="年级综合平均分" stroke="var(--accent)" fillOpacity={1} fill="url(#colorAvg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GradeAnalysis;
