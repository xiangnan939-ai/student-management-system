import { useEffect, useState, useCallback, Fragment } from 'react';
import { Search, RefreshCw, ChevronDown, ChevronRight, Download, Filter, X } from 'lucide-react';
import { authHeaders } from '../api';
import { displayBeijingTime } from '../time';

const LOG_LEVELS = [
  { value: '', label: '全部级别', color: '' },
  { value: 'success', label: '成功', color: 'var(--success)' },
  { value: 'info', label: '信息', color: 'var(--primary)' },
  { value: 'warning', label: '警告', color: 'var(--warning)' },
  { value: 'error', label: '错误', color: 'var(--danger)' },
  { value: 'crash', label: '严重', color: '#ff0044' },
];

const CATEGORIES = [
  { value: '', label: '全部分类' },
  { value: 'auth', label: '认证登录' },
  { value: 'student', label: '学生管理' },
  { value: 'student-account', label: '学生账号' },
  { value: 'course', label: '课程管理' },
  { value: 'course-selection', label: '选课操作' },
  { value: 'account', label: '管理员账号' },
  { value: 'system', label: '系统' },
  { value: 'system-logs', label: '日志模块' },
  { value: 'api', label: 'API错误' },
  { value: 'client', label: '前端' },
];

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 20;

  const fetchLogs = useCallback((p = page, kw = keyword, lvl = level, cat = category) => {
    setLoading(true);
    const params = new URLSearchParams({
      paginated: 'true',
      page: String(p),
      limit: String(pageSize),
    });
    if (kw) params.set('keyword', kw);
    if (lvl) params.set('levels', lvl);
    if (cat) params.set('category', cat);

    fetch(`/api/system-logs?${params.toString()}`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        setLogs(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || p);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [page, keyword, level, category]);

  useEffect(() => {
    fetchLogs(1, keyword, level, category);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(searchInput);
    fetchLogs(1, searchInput, level, category);
  };

  const handleLevelChange = (newLevel) => {
    setLevel(newLevel);
    setPage(1);
    fetchLogs(1, keyword, newLevel, category);
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setPage(1);
    fetchLogs(1, keyword, level, newCategory);
  };

  const resetFilters = () => {
    setSearchInput('');
    setKeyword('');
    setLevel('');
    setCategory('');
    setPage(1);
    fetchLogs(1, '', '', '');
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', '级别', '分类', '消息', '操作者', 'IP', '目标ID', '方法', '路径', '时间'];
    const rows = logs.map(l => [
      l.id, l.level, l.category,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      l.actor || 'system',
      l.ip || '',
      l.target_id || '',
      l.method || '',
      l.path || '',
      l.created_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `系统日志_${new Date().toLocaleDateString('zh-CN')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const levelBadge = (lvl) => {
    const cfg = LOG_LEVELS.find(l => l.value === lvl) || LOG_LEVELS[2];
    const color = cfg.color;
    return (
      <span style={{
        fontSize: '0.75rem',
        padding: '2px 8px',
        borderRadius: '4px',
        fontWeight: 600,
        background: color ? `${color}20` : 'var(--bg-elevated)',
        color: color || 'var(--text-dim)',
        border: `1px solid ${color || 'var(--border-color)'}`,
        whiteSpace: 'nowrap',
      }}>
        {cfg.label}
      </span>
    );
  };

  const formatUA = (ua) => {
    if (!ua) return '未知';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/')) return 'Safari';
    return ua.slice(0, 40) + (ua.length > 40 ? '...' : '');
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>系统日志</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            共 {total.toLocaleString()} 条日志，自动保留最近 7 天
          </p>
        </div>
        <div className="flex-center gap-3">
          <button className="btn-secondary" onClick={exportToCSV} disabled={logs.length === 0}>
            <Download size={16} /> 导出当前页
          </button>
          <button className="btn-secondary" onClick={() => fetchLogs(page, keyword, level, category)} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> 刷新
          </button>
        </div>
      </div>

      {/* 搜索与筛选栏 */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="搜索消息、IP、详情..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <button type="submit" className="btn-primary">搜索</button>
          </form>
          <button
            className="btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Filter size={16} /> 筛选 {(level || category) && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }}></span>}
          </button>
        </div>

        {showFilters && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>级别：</span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {LOG_LEVELS.map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => handleLevelChange(l.value)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      border: `1px solid ${level === l.value ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: level === l.value ? 'var(--primary)' : 'var(--bg-elevated)',
                      color: level === l.value ? '#fff' : 'var(--text-dim)',
                      cursor: 'pointer',
                      fontWeight: level === l.value ? 600 : 400,
                    }}
                  >{l.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>分类：</span>
              <select
                className="input-field"
                style={{ padding: '6px 10px', fontSize: '0.85rem', minWidth: '140px' }}
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            {(keyword || level || category) && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} /> 重置筛选
              </button>
            )}
          </div>
        )}
      </div>

      {/* 日志列表 */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>日志加载中...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-dim)' }}>
            {keyword || level || category ? '没有符合筛选条件的日志' : '暂无日志记录'}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th style={{ width: 80 }}>级别</th>
                    <th>消息内容</th>
                    <th style={{ width: 100 }}>分类</th>
                    <th style={{ width: 110 }}>操作者</th>
                    <th style={{ width: 130 }}>IP 地址</th>
                    <th style={{ width: 170 }}>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <Fragment key={log.id}>
                      <tr
                        style={{ cursor: log.detail ? 'pointer' : 'default' }}
                        onClick={() => log.detail && toggleExpand(log.id)}
                        className={log.detail ? 'log-row-clickable' : ''}
                      >
                        <td style={{ textAlign: 'center' }}>
                          {log.detail ? (
                            expandedId === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                          ) : (
                            <span style={{ color: 'var(--text-dim)', opacity: 0.3 }}>·</span>
                          )}
                        </td>
                        <td>{levelBadge(log.level)}</td>
                        <td style={{ fontWeight: 500 }}>
                          <div style={{ wordBreak: 'break-word' }}>{log.message}</div>
                          {log.target_id && (
                            <span style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-dim)',
                              background: 'var(--bg-elevated)',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              marginLeft: '8px',
                              fontFamily: 'monospace',
                            }}>目标: {log.target_id}</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{log.category}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 500 }}>{log.actor || 'system'}</span>
                        </td>
                        <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-dim)' }}>
                          {log.ip || <span style={{ opacity: 0.4 }}>-</span>}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {displayBeijingTime(log.created_at)}
                        </td>
                      </tr>
                      {expandedId === log.id && log.detail && (
                        <tr key={`${log.id}-detail`}>
                          <td colSpan={7} style={{ padding: 0, background: 'var(--bg-dark)' }}>
                            <div style={{
                              padding: '16px 20px',
                              borderLeft: '3px solid var(--warning)',
                              margin: '0 12px 12px 12px',
                              background: 'rgba(0,0,0,0.3)',
                              borderRadius: '0 6px 6px 0',
                            }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px 20px', marginBottom: '12px', fontSize: '0.8rem' }}>
                                {log.method && log.path && (
                                  <div><span style={{ color: 'var(--text-dim)' }}>请求：</span><code style={{ background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: '3px', fontSize: '0.78rem' }}>{log.method} {log.path}</code></div>
                                )}
                                {log.user_agent && (
                                  <div><span style={{ color: 'var(--text-dim)' }}>浏览器：</span>{formatUA(log.user_agent)}</div>
                                )}
                                {log.ip && (
                                  <div><span style={{ color: 'var(--text-dim)' }}>完整IP：</span><span style={{ fontFamily: 'monospace' }}>{log.ip}</span></div>
                                )}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>详细错误堆栈：</div>
                              <pre style={{
                                margin: 0,
                                padding: '12px',
                                background: 'rgba(0,0,0,0.4)',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                color: 'var(--text-dim)',
                                overflowX: 'auto',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                maxHeight: '300px',
                                overflowY: 'auto',
                              }}>{log.detail}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                第 {page} / {totalPages} 页，共 {total.toLocaleString()} 条
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  className="btn-secondary"
                  disabled={page <= 1 || loading}
                  onClick={() => { setPage(page - 1); fetchLogs(page - 1, keyword, level, category); }}
                  style={{ padding: '5px 12px', fontSize: '0.82rem' }}
                >上一页</button>
                <span style={{
                  minWidth: '32px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>{page}</span>
                <button
                  className="btn-secondary"
                  disabled={page >= totalPages || loading}
                  onClick={() => { setPage(page + 1); fetchLogs(page + 1, keyword, level, category); }}
                  style={{ padding: '5px 12px', fontSize: '0.82rem' }}
                >下一页</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
