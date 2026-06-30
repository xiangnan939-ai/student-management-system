import { Server, Database, Monitor, Cpu, ArrowRight, Zap, Shield, GitBranch, Terminal } from 'lucide-react';

const Architecture = () => {
  return (
    <div className="fade-in-up" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 8px 0', color: 'white' }}>
            系统架构与并发控制
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
            多线程架构 (Multi-threading) 与 互斥锁 (Mutex) 设计说明
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="badge badge-blue">Node.js worker_threads</div>
          <div className="badge badge-green">React SPA</div>
          <div className="badge badge-orange">SQLite 3</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        
        {/* Left: Clean Topology Graph */}
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GitBranch size={20} color="var(--primary)" /> 系统拓扑图 (Topology)
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px 0' }}>
            
            {/* Client */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Monitor size={40} color="#10b981" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>Web Client</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>React / Fetch API</div>
              </div>
            </div>

            <ArrowRight size={24} color="var(--text-muted)" />

            {/* Server */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Server size={50} color="#3b82f6" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'white', fontSize: '1.2rem' }}>Express Node</div>
                <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600 }}>主线程调度 (Main Thread)</div>
              </div>
              
              {/* Workers */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={18} color="#a855f7" />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Worker Threads</div>
            </div>

            <ArrowRight size={24} color="var(--text-muted)" />

            {/* Database */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={40} color="#f59e0b" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>SQLite DB</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>本地存储</div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Technical Explanation Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="#a855f7" /> 多线程架构
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              系统采用 Node.js <code>worker_threads</code> 构建。主线程负责接收前端请求并进行负载分发，子线程（Worker）独立执行具体的数据库写入与加密任务。这实现了真正的物理级多线程并行，极大提升了 CPU 密集型任务的处理效率。
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="#f59e0b" /> 互斥锁 (Mutex) 实现
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              在多线程同时读写底层同一个 SQLite 数据库文件时，极易发生 <code>database is locked</code> 冲突。我们在服务端实现了一个全局 <strong>Mutex 互斥锁</strong>：任何线程在执行写入操作前必须请求锁，操作完成后释放锁。若锁已被占用，其他线程的请求将进入异步队列阻塞排队。
            </p>
          </div>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--primary)" /> 并发与并行的区别
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              传统的 Node.js 异步 I/O 是<strong>并发 (Concurrency)</strong>，它在单线程上快速切换上下文；而本系统利用多核 CPU 的 Worker Threads，实现了真正的<strong>并行 (Parallelism)</strong>计算，这正是现代操作系统底层的核心特征。
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} /> 核心架构代码 (Java 多线程启动)
            </h4>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#abb2bf', lineHeight: 1.5, overflowX: 'auto' }}>
              <span style={{ color: '#c678dd' }}>public class</span> <span style={{ color: '#e5c07b' }}>ServerArchitecture</span> {'{'}<br/>
              &nbsp;&nbsp;<span style={{ color: '#c678dd' }}>public static void</span> <span style={{ color: '#61afef' }}>main</span>(<span style={{ color: '#e5c07b' }}>String</span>[] args) {'{'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 主线程调度：分发任务给子线程执行，实现并行架构</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>for</span> (<span style={{ color: '#c678dd' }}>int</span> i = <span style={{ color: '#d19a66' }}>1</span>; i &lt;= <span style={{ color: '#d19a66' }}>3</span>; i++) {'{'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e5c07b' }}>Thread</span> worker = <span style={{ color: '#c678dd' }}>new</span> <span style={{ color: '#e5c07b' }}>Thread</span>(() -&gt; {'{'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 子线程：并行执行 CPU 密集型任务，不阻塞主线程</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#61afef' }}>processDataAndWriteToDB</span>();<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{'}'});<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;worker.<span style={{ color: '#61afef' }}>start</span>(); <span style={{ color: '#7f848e', fontStyle: 'italic' }}>// 启动子线程进入就绪态</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
              &nbsp;&nbsp;{'}'}<br/>
              {'}'}
            </div>
          </div>

        </div>

      </div>
      
    </div>
  );
};

export default Architecture;
