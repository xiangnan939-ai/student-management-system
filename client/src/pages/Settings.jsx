import { Shield, Globe, Bell } from 'lucide-react';

const Settings = () => {
  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>系统底层偏好设置 (演示模块)</h1>
        <p style={{ color: 'var(--text-muted)' }}>管理集群参数、安全策略及全局中间件配置</p>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer' }}>通用配置</div>
          <div style={{ padding: '16px 24px', color: 'var(--text-muted)', cursor: 'pointer' }}>安全与审计</div>
          <div style={{ padding: '16px 24px', color: 'var(--text-muted)', cursor: 'pointer' }}>并发控制策略</div>
          <div style={{ padding: '16px 24px', color: 'var(--text-muted)', cursor: 'pointer' }}>多租户接口</div>
        </div>

        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flexShrink: 0, padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '12px', height: 'fit-content' }}>
              <Globe size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>集群部署节点</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>配置当前系统连接的底层数据库集群节点区域。</p>
              <select className="input-field" style={{ width: '300px' }} defaultValue="cn-east">
                <option value="cn-east">华东主节点 (cn-east-1) - 当前</option>
                <option value="cn-south">华南灾备节点 (cn-south-1)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flexShrink: 0, padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '12px', height: 'fit-content' }}>
              <Shield size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>JWT 签发策略</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>设置 Token 存活时间及无状态会话的刷新阈值。</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <input type="number" className="input-field" style={{ width: '100px' }} defaultValue={72} />
                <span style={{ color: 'var(--text-muted)' }}>小时过期</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flexShrink: 0, padding: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '12px', height: 'fit-content' }}>
              <Bell size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>系统级告警降级</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>当多线程压测负载过高时，是否允许自动降级丢弃非核心日志。</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                <span>开启高可用服务熔断保护</span>
              </label>
            </div>
          </div>

        </div>
        
        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button className="btn-secondary">还原默认配置</button>
          <button className="btn-primary">保存全局设置</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
