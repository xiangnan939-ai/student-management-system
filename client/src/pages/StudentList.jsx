import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Download, Trash2, Edit, X } from 'lucide-react';
import { jsonHeaders, authHeaders } from '../api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', gender: '男', age: '', major: '', phone: '' });

  const fetchStudents = useCallback((p = 1, k = keyword) => {
    setLoading(true);
    fetch(`/api/students?page=${p}&limit=10&keyword=${encodeURIComponent(k)}`)
      .then(res => res.json())
      .then(data => {
        setStudents(data.data);
        setTotalPages(data.totalPages);
        setPage(data.page);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [keyword]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchStudents(page, keyword);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [page, keyword, fetchStudents]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents(1, keyword);
  };

  const handleDelete = (id) => {
    if (window.confirm('警告: 这将永久删除该学生的档案记录，确定吗？')) {
      fetch(`/api/students/${id}`, { method: 'DELETE', headers: authHeaders() })
        .then(() => fetchStudents(page))
        .catch(err => console.error(err));
    }
  };

  const openDrawer = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({ id: '', name: '', gender: '男', age: '', major: '', phone: '' });
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
    const method = editingStudent ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: jsonHeaders(),
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else {
          closeDrawer();
          fetchStudents(page);
        }
      });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) setSelectedIds([]);
    else setSelectedIds(students.map(s => s.id));
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  // 纯前端导出 CSV 功能
  const exportToCSV = () => {
    if (students.length === 0) return alert('没有数据可导出');
    const headers = ['学号', '姓名', '性别', '年龄', '专业', '联系电话'];
    const rows = students.map(s => [s.id, s.name, s.gender, s.age, s.major, s.phone]);
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `学生档案名册_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMajorBadgeClass = (major) => {
    if (major.includes('计算机') || major.includes('软件') || major.includes('多线程')) return 'badge-blue';
    if (major.includes('外语') || major.includes('文学')) return 'badge-purple';
    if (major.includes('理') || major.includes('数学')) return 'badge-green';
    return 'badge-orange';
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>学籍管理</h1>
          <p style={{ color: 'var(--text-muted)' }}>统一管理全校学生档案，支持千万级数据的多条件检索与批量导出</p>
        </div>
        <div className="flex-center gap-4">
          <button className="btn-secondary" onClick={exportToCSV}>
            <Download size={18} /> 导出为 Excel
          </button>
          <button className="btn-primary" onClick={() => openDrawer()}>
            <Plus size={18} /> 新增学生档案
          </button>
        </div>
      </div>

      {/* 高级工具栏 */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="按学号或姓名精确检索..." 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '44px' }}
            />
          </div>
          <button type="submit" className="btn-secondary">查询</button>
        </form>

        <div className="flex-center gap-4">
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Filter size={16} /> 高级筛选
          </button>
          {selectedIds.length > 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>已选择 {selectedIds.length} 项</span>
          )}
        </div>
      </div>

      {/* 数据表格区域 */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>系统数据加载中...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" checked={students.length > 0 && selectedIds.length === students.length} onChange={toggleSelectAll} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                  </th>
                  <th>学生档案</th>
                  <th>学号 (UID)</th>
                  <th>状态</th>
                  <th>年龄</th>
                  <th>院系专业</th>
                  <th>联系电话</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelect(student.id)} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${student.id}`} alt="avatar" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{student.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{student.id}</td>
                    <td>
                      <span className={`badge ${student.gender === '男' ? 'badge-blue' : 'badge-purple'}`}>
                        {student.gender}
                      </span>
                    </td>
                    <td>{student.age} 岁</td>
                    <td>
                      <span className={`badge ${getMajorBadgeClass(student.major)}`}>{student.major}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{student.phone}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => openDrawer(student)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '6px' }} title="编辑记录">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(student.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px', marginLeft: '8px' }} title="删除档案">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                      未检索到匹配的档案记录。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* 分页控制器 */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            显示第 {(page - 1) * 10 + 1} 到 {Math.min(page * 10, page * 10 /* need total items ideally, simplified here */)} 条，共 {totalPages} 页
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-secondary" 
              disabled={page <= 1} 
              onClick={() => setPage(page - 1)}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >上一页</button>
            <div className="flex-center" style={{ width: '32px', height: '32px', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>{page}</div>
            <button 
              className="btn-secondary" 
              disabled={page >= totalPages} 
              onClick={() => setPage(page + 1)}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >下一页</button>
          </div>
        </div>
      </div>

      {/* 高级侧边抽屉 (Drawer) 表单 */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={closeDrawer}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>{editingStudent ? '编辑档案记录' : '录入新生档案'}</h2>
              <button onClick={closeDrawer} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>学号 (UID) *</label>
                <input type="text" className="input-field" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} required disabled={!!editingStudent} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>真实姓名 *</label>
                <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>性别</label>
                  <select className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>年龄</label>
                  <input type="number" className="input-field" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>归属院系/专业 *</label>
                <input type="text" className="input-field" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>联系电话</label>
                <input type="text" className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={closeDrawer}>取消</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>{editingStudent ? '保存修改' : '确认录入'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentList;
