import { useState, useEffect, useRef } from 'react';
import { Terminal, ShieldCheck, Database, Cpu, Activity, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { jsonHeaders } from '../api';

const ConcurrencyLab = () => {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [mutexState, setMutexState] = useState('UNLOCKED'); // UNLOCKED, LOCKED_M, LOCKED_E, LOCKED_W
  const logsEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const syncMutexState = (entry) => {
    if (entry.action === 'lock' || entry.action === 'warning') {
      if (entry.threadName.includes('本部')) setMutexState('LOCKED_M');
      if (entry.threadName.includes('东')) setMutexState('LOCKED_E');
      if (entry.threadName.includes('西')) setMutexState('LOCKED_W');
    } else if (entry.action === 'unlock' || entry.action === 'success') {
      setMutexState('UNLOCKED');
    }
  };

  const startTest = async (useMutex) => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([{ timestamp: new Date().toLocaleTimeString(), threadName: 'System', action: 'info', message: useMutex ? '初始化并发环境 (开启互斥锁)...' : '初始化并发环境 (无锁模式)...' }]);
    setMutexState('UNLOCKED');
    
    try {
      const response = await fetch('/api/start-concurrent-test', { 
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ useMutex })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '并发测试启动失败');

      const returnedLogs = data.logs || [];
      returnedLogs.forEach((entry, index) => {
        setTimeout(() => {
          setLogs((prev) => [...prev, entry]);
          syncMutexState(entry);
          if (index === returnedLogs.length - 1) {
            setIsRunning(false);
            setMutexState('UNLOCKED');
          }
        }, index * 90);
      });
    } catch (error) {
      console.error(error);
      setLogs((prev) => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        threadName: 'System',
        action: 'error',
        message: error.message
      }]);
      setIsRunning(false);
    }
  };

  const getLogColor = (action) => {
    switch(action) {
      case 'info': return '#3b82f6';
      case 'wait': return '#f59e0b';
      case 'lock': return '#10b981';
      case 'unlock': return '#8b5cf6';
      case 'error': return '#ef4444';
      case 'warning': return '#f97316';
      case 'success': return '#10b981';
      default: return '#a1a1aa';
    }
  };

  // Helper to determine thread status
  const getThreadStatus = (threadId) => {
    if (mutexState === 'UNLOCKED') return 'idle';
    if (mutexState === `LOCKED_${threadId}`) return 'active';
    return 'blocked';
  };

  return (
    <div className="fade-in-up" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={28} color="var(--primary)" /> 操作系统并发实验室
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
            多线程环境下的互斥锁 (Mutex) 与临界区安全写入直观演示
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => startTest(false)}
            disabled={isRunning}
            className="btn-danger"
          >
            <AlertTriangle size={18} /> 无锁并发测试 (引发崩溃)
          </button>

          <button 
            onClick={() => startTest(true)}
            disabled={isRunning}
            className="btn-primary"
            style={{ background: isRunning ? 'var(--bg-elevated)' : 'var(--primary)', color: isRunning ? 'var(--text-muted)' : 'white' }}
          >
            <ShieldCheck size={18} /> 开启互斥锁运行 (安全写入)
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left: Pipeline Visualization */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>数据流与锁状态实时监控</h3>
            <div style={{ 
              padding: '6px 12px', 
              borderRadius: '6px', 
              background: mutexState === 'UNLOCKED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${mutexState === 'UNLOCKED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: mutexState === 'UNLOCKED' ? 'var(--success)' : 'var(--danger)',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: 600, fontSize: '0.9rem'
            }}>
              {mutexState === 'UNLOCKED' ? <Unlock size={16} /> : <Lock size={16} />}
              {mutexState === 'UNLOCKED' ? '互斥锁空闲' : '临界区被占用'}
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0' }}>
            
            {/* Threads (Left side) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '180px' }}>
              {[
                { id: 'M', name: '校本部 Worker', color: '#3b82f6' },
                { id: 'E', name: '东校区 Worker', color: '#10b981' },
                { id: 'W', name: '西校区 Worker', color: '#f59e0b' }
              ].map(t => {
                const status = getThreadStatus(t.id);
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={`node-${status}`} style={{ 
                      width: '48px', height: '48px', borderRadius: '12px', 
                      background: 'var(--bg-elevated)', border: '2px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s'
                    }}>
                      <Cpu size={24} />
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: status === 'active' ? 'var(--success)' : status === 'blocked' ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {status === 'active' ? '正在写入...' : status === 'blocked' ? '等待锁释放...' : '空闲 / 待命'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Connecting Pipelines */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '80px', padding: '0 20px' }}>
              {['M', 'E', 'W'].map((id) => {
                const status = getThreadStatus(id);
                return (
                  <div key={id} className={`data-pipeline ${status === 'active' ? 'active-green' : status === 'blocked' ? 'active-red' : ''}`} />
                );
              })}
            </div>

            {/* Database (Right side) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px' }}>
              <div className={`node-${mutexState === 'UNLOCKED' ? 'idle' : 'active'}`} style={{
                width: '100px', height: '100px', borderRadius: '16px',
                background: 'var(--bg-elevated)', border: '2px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.3s'
              }}>
                <Database size={40} />
              </div>
              <div style={{ marginTop: '16px', color: 'white', fontWeight: 600, textAlign: 'center' }}>SQLite 数据库</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '4px' }}>唯一临界资源</div>
            </div>

          </div>
        </div>

        {/* Right: Knowledge Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} /> 互斥锁 (Mutex)
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              互斥锁是并发编程中保证数据一致性的核心机制。它确保同一时刻只有一个线程可以执行特定的代码段。线程在写入前必须先获取锁 (<code>acquire</code>)，如果锁被占用，线程将被<strong>阻塞并挂起</strong>，直到锁被释放 (<code>release</code>)。
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--warning)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> 临界区 (Critical Section)
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              临界区是指访问共享资源（如本实验中的 SQLite 数据库文件）的代码区域。SQLite 是文件级锁数据库，如果多个 <code>worker_threads</code> 同时向同一个文件发起写操作，就会触发文件锁冲突，导致 <strong>database is locked</strong> 崩溃或数据损坏。
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--success)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} /> 多线程并行 (Multi-threading)
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              Node.js 默认是单线程非阻塞 I/O，但面对 CPU 密集型任务时，主线程容易卡死。通过 <code>worker_threads</code> 模块，我们可以利用多核 CPU 实现真正的并行计算。互斥锁就是用来协调这些并行线程，让它们有序地访问底层共享资源的。
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#60a5fa', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} /> 核心并发代码 (Java 互斥锁实现)
            </h4>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#abb2bf', lineHeight: 1.5, overflowX: 'auto' }}>
              <span style={{ color: '#c678dd' }}>import</span> java.util.concurrent.locks.ReentrantLock;<br/><br/>
              <span style={{ color: '#c678dd' }}>public class</span> <span style={{ color: '#e5c07b' }}>DatabaseManager</span> {'{'}<br/>
              &nbsp;&nbsp;<span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 1. 定义公平互斥锁 (Mutex)，确保多线程排队顺序</span><br/>
              &nbsp;&nbsp;<span style={{ color: '#c678dd' }}>private final</span> <span style={{ color: '#e5c07b' }}>ReentrantLock</span> mutex = <span style={{ color: '#c678dd' }}>new</span> <span style={{ color: '#e5c07b' }}>ReentrantLock</span>(<span style={{ color: '#d19a66' }}>true</span>);<br/><br/>
              &nbsp;&nbsp;<span style={{ color: '#c678dd' }}>public void</span> <span style={{ color: '#61afef' }}>safeWrite</span>(<span style={{ color: '#e5c07b' }}>String</span> data) {'{'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 2. 线程尝试获取锁，若锁被其他线程占用，则在此阻塞挂起等待</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;mutex.<span style={{ color: '#61afef' }}>lock</span>();<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>try</span> {'{'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#7f848e', fontStyle: 'italic' }}>// ========== 临界区 (Critical Section) 开始 ==========</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e5c07b' }}>System</span>.out.<span style={{ color: '#61afef' }}>println</span>(<span style={{ color: '#e5c07b' }}>Thread</span>.<span style={{ color: '#61afef' }}>currentThread</span>().<span style={{ color: '#61afef' }}>getName</span>() + <span style={{ color: '#98c379' }}>" 进入临界区进行安全写入..."</span>);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 模拟独占访问底层的 SQLite 数据库文件</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;dbConnection.<span style={{ color: '#61afef' }}>insert</span>(data);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#7f848e', fontStyle: 'italic' }}>// ========== 临界区 (Critical Section) 结束 ==========</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;{'}'} <span style={{ color: '#c678dd' }}>catch</span> (<span style={{ color: '#e5c07b' }}>Exception</span> e) {'{'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e.<span style={{ color: '#61afef' }}>printStackTrace</span>();<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;{'}'} <span style={{ color: '#c678dd' }}>finally</span> {'{'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 3. 无论写入成功或异常，务必在 finally 中释放锁，防止死锁发生</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;mutex.<span style={{ color: '#61afef' }}>unlock</span>();<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
              &nbsp;&nbsp;{'}'}<br/>
              {'}'}
            </div>
          </div>

        </div>

      </div>

      {/* Terminal Logs */}
      <div className="terminal-window" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
        <div className="terminal-header">
          <Terminal size={16} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>~/student-os/concurrency-logs</span>
        </div>
        
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, fontSize: '0.85rem', lineHeight: 1.6 }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic' }}>系统就绪。请点击右上方按钮开始并发测试...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                <span style={{ color: '#666' }}>[{log.timestamp}]</span>{' '}
                <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{log.threadName}</span>{' '}
                <span style={{ color: getLogColor(log.action) }}>{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
      
    </div>
  );
};

export default ConcurrencyLab;
