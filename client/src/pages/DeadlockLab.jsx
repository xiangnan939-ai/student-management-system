import { useState } from 'react';
import { AlertOctagon, Lock, Cpu, RotateCcw, AlertTriangle, Terminal } from 'lucide-react';

const DeadlockLab = () => {
  const [step, setStep] = useState(0);

  const advanceStep = () => {
    if (step < 4) setStep(s => s + 1);
  };

  const reset = () => setStep(0);

  const aHolds1 = step >= 1;
  const bHolds2 = step >= 2;
  const aRequests2 = step >= 3;
  const bRequests1 = step >= 4;
  const isDeadlock = step === 4;

  return (
    <div className="fade-in-up" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertOctagon size={32} color={isDeadlock ? "var(--danger)" : "var(--primary)"} /> 
            死锁 (Deadlock) 与交叉锁演练
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
            极其直观地演示多线程并发中由于资源竞争导致的环路等待灾难
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={advanceStep}
            disabled={isDeadlock}
            className={isDeadlock ? "btn-danger" : "btn-primary"}
            style={{ opacity: isDeadlock ? 0.5 : 1, transition: 'all 0.3s' }}
          >
            {step === 0 ? "1. 线程 A 获取锁 1" : 
             step === 1 ? "2. 线程 B 获取锁 2" : 
             step === 2 ? "3. 线程 A 请求锁 2" : 
             step === 3 ? "4. 线程 B 请求锁 1" : "发生死锁"}
          </button>
          <button onClick={reset} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={18} /> 重置实验
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: '400px' }}>
          
          {isDeadlock && (
            <div className="fade-in-up" style={{ position: 'absolute', top: '20px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 20 }}>
              <AlertTriangle size={20} /> 警告：检测到死锁 (DEADLOCK)！系统永久挂起。
            </div>
          )}

          <div style={{ position: 'relative', width: '400px', height: '300px', marginTop: '60px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', border: `2px solid ${isDeadlock ? 'var(--danger)' : '#3b82f6'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10, transition: 'border-color 0.3s' }}>
              <Cpu size={24} color={isDeadlock ? "var(--danger)" : "#3b82f6"} style={{ transition: 'color 0.3s' }} />
              <span style={{ fontSize: '0.8rem', marginTop: '4px', fontWeight: 'bold' }}>线程 A</span>
            </div>

            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)', border: `2px solid ${isDeadlock ? 'var(--danger)' : '#a855f7'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10, transition: 'border-color 0.3s' }}>
              <Cpu size={24} color={isDeadlock ? "var(--danger)" : "#a855f7"} style={{ transition: 'color 0.3s' }} />
              <span style={{ fontSize: '0.8rem', marginTop: '4px', fontWeight: 'bold' }}>线程 B</span>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}>
              <Lock size={24} color="#10b981" />
              <span style={{ fontSize: '0.8rem', marginTop: '4px' }}>互斥锁 1</span>
            </div>

            <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '2px solid #f59e0b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}>
              <Lock size={24} color="#f59e0b" />
              <span style={{ fontSize: '0.8rem', marginTop: '4px' }}>互斥锁 2</span>
            </div>

            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
              <defs>
                <marker id="arrow-green" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
              </defs>
              
              {aHolds1 && <line x1="40" y1="80" x2="40" y2="200" stroke="#10b981" strokeWidth="4" markerEnd="url(#arrow-green)" style={{ transition: 'stroke 0.3s' }} />}
              {bHolds2 && <line x1="360" y1="220" x2="360" y2="100" stroke="#10b981" strokeWidth="4" markerEnd="url(#arrow-green)" style={{ transition: 'stroke 0.3s' }} />}
              {aRequests2 && <line x1="80" y1="40" x2="300" y2="40" stroke="#ef4444" strokeWidth="4" strokeDasharray="8,8" markerEnd="url(#arrow-red)" className="dash-anim" />}
              {bRequests1 && <line x1="320" y1="260" x2="100" y2="260" stroke="#ef4444" strokeWidth="4" strokeDasharray="8,8" markerEnd="url(#arrow-red)" className="dash-anim" />}
            </svg>

          </div>
          
          <div style={{ marginTop: 'auto', display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{ width: '20px', height: '4px', background: '#10b981' }}></div> 成功获取 (持有)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{ width: '20px', height: '4px', background: 'transparent', borderBottom: '2px dashed #ef4444' }}></div> 请求并阻塞 (等待)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} color="var(--danger)" /> 什么是死锁？
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              死锁是指两个或多个线程在执行过程中，因争夺互斥锁而造成的一种<strong>循环互相等待</strong>的现象。<br/><br/>
              如果代码中存在多个锁，且不同线程获取锁的<strong>顺序不一致</strong>，就极易引发死锁，导致整个系统进程卡死。
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} /> 导致死锁的核心 Java 代码
            </h4>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#abb2bf', lineHeight: 1.5, overflowX: 'auto' }}>
              <span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 线程 A 的代码逻辑</span><br/>
              <span style={{ color: '#c678dd' }}>public void</span> <span style={{ color: '#61afef' }}>threadATask</span>() {'{'}<br/>
              &nbsp;&nbsp;<span style={{ color: '#c678dd' }}>synchronized</span>(lock1) {'{'} <span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 1. 获取锁 1</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e5c07b' }}>Thread</span>.<span style={{ color: '#61afef' }}>sleep</span>(<span style={{ color: '#d19a66' }}>100</span>);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>synchronized</span>(lock2) {'{'} <span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 3. 尝试获取锁 2 (被阻塞)</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e5c07b' }}>System</span>.out.<span style={{ color: '#61afef' }}>println</span>(<span style={{ color: '#98c379' }}>"A 完成"</span>);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
              &nbsp;&nbsp;{'}'}<br/>
              {'}'}<br/>
              <br/>
              <span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 线程 B 的代码逻辑 (顺序相反)</span><br/>
              <span style={{ color: '#c678dd' }}>public void</span> <span style={{ color: '#61afef' }}>threadBTask</span>() {'{'}<br/>
              &nbsp;&nbsp;<span style={{ color: '#c678dd' }}>synchronized</span>(lock2) {'{'} <span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 2. 获取锁 2</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e5c07b' }}>Thread</span>.<span style={{ color: '#61afef' }}>sleep</span>(<span style={{ color: '#d19a66' }}>100</span>);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>synchronized</span>(lock1) {'{'} <span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 4. 尝试获取锁 1 (被阻塞)</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e5c07b' }}>System</span>.out.<span style={{ color: '#61afef' }}>println</span>(<span style={{ color: '#98c379' }}>"B 完成"</span>);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
              &nbsp;&nbsp;{'}'}<br/>
              {'}'}
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        .dash-anim {
          animation: dash 1s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: -16; }
        }
      `}</style>
    </div>
  );
};

export default DeadlockLab;
