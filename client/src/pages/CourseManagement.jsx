import { useEffect, useState } from 'react';
import { Edit, Plus, RefreshCw, Save, Trash2, Users, X } from 'lucide-react';
import { authHeaders, jsonHeaders } from '../api';

const emptyCourse = {
  name: '',
  teacher: '',
  time: '',
  location: '',
  credit: '',
  capacity: '',
  description: '',
};

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState(emptyCourse);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [studentsModal, setStudentsModal] = useState({ open: false, course: null, students: [], loading: false });

  const fetchCourses = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/courses', { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '课程读取失败');
      setCourses(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadCourses = async () => {
      try {
        const response = await fetch('/api/courses', { headers: authHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '课程读取失败');
        if (!ignore) setCourses(data.data || []);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadCourses();

    return () => {
      ignore = true;
    };
  }, []);

  const openDrawer = (course = null) => {
    setEditingCourse(course);
    setFormData(course ? {
      name: course.name,
      teacher: course.teacher,
      time: course.time,
      location: course.location,
      credit: course.credit,
      capacity: course.capacity,
      description: course.description || '',
    } : emptyCourse);
    setError('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingCourse(null);
    setFormData(emptyCourse);
  };

  const saveCourse = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses';
      const response = await fetch(url, {
        method: editingCourse ? 'PUT' : 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '保存失败');

      setMessage(editingCourse ? '课程已更新' : '课程已新增');
      closeDrawer();
      fetchCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (course) => {
    if (!window.confirm(`确定删除课程「${course.name}」吗？学生的相关选课记录也会一起删除。`)) return;

    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '删除失败');

      setMessage('课程已删除');
      fetchCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  const openStudentsModal = async (course) => {
    setStudentsModal({ open: true, course, students: [], loading: true });
    setError('');

    try {
      const response = await fetch(`/api/courses/${course.id}/students`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '选课学生读取失败');

      setStudentsModal({ open: true, course, students: data.data || [], loading: false });
    } catch (err) {
      setStudentsModal({ open: true, course, students: [], loading: false });
      setError(err.message);
    }
  };

  const closeStudentsModal = () => {
    setStudentsModal({ open: false, course: null, students: [], loading: false });
  };

  const remain = (course) => Math.max(Number(course.capacity || 0) - Number(course.selected_count || 0), 0);

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>课程管理</h1>
          <p style={{ color: 'var(--text-muted)' }}>维护学生端“选课管理”中展示的课程</p>
        </div>
        <div className="flex-center gap-4">
          <button type="button" className="btn-secondary" onClick={fetchCourses} disabled={loading}>
            <RefreshCw size={18} /> 刷新
          </button>
          <button type="button" className="btn-primary" onClick={() => openDrawer()}>
            <Plus size={18} /> 新增课程
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            border: `1px solid ${error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: error ? 'var(--danger)' : 'var(--success)',
          }}
        >
          {error || message}
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>课程数据加载中...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>课程名称</th>
                  <th>任课教师</th>
                  <th>上课时间</th>
                  <th>地点</th>
                  <th>学分</th>
                  <th>容量</th>
                  <th>已选</th>
                  <th>剩余</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{course.name}</div>
                      {course.description && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>{course.description}</div>
                      )}
                    </td>
                    <td>{course.teacher}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{course.time}</td>
                    <td>{course.location}</td>
                    <td>{course.credit}</td>
                    <td>{course.capacity}</td>
                    <td>{course.selected_count || 0}</td>
                    <td>
                      <span className={`badge ${remain(course) > 0 ? 'badge-green' : 'badge-orange'}`}>{remain(course)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => openStudentsModal(course)} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '6px' }} title="查看选课学生">
                        <Users size={18} />
                      </button>
                      <button onClick={() => openDrawer(course)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '6px' }} title="编辑课程">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => deleteCourse(course)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px', marginLeft: '8px' }} title="删除课程">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                      暂无课程，请新增课程。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawerOpen && (
        <div className="drawer-overlay">
          <form className="drawer-content" onSubmit={saveCourse}>
            <div className="flex-between" style={{ marginBottom: '28px' }}>
              <h2>{editingCourse ? '编辑课程' : '新增课程'}</h2>
              <button type="button" onClick={closeDrawer} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="关闭">
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <input className="input-field" placeholder="课程名称" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
              <input className="input-field" placeholder="任课教师" value={formData.teacher} onChange={(event) => setFormData({ ...formData, teacher: event.target.value })} required />
              <input className="input-field" placeholder="上课时间" value={formData.time} onChange={(event) => setFormData({ ...formData, time: event.target.value })} required />
              <input className="input-field" placeholder="上课地点" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} required />
              <input className="input-field" type="number" step="0.5" min="0.5" placeholder="学分" value={formData.credit} onChange={(event) => setFormData({ ...formData, credit: event.target.value })} required />
              <input className="input-field" type="number" min="1" placeholder="人数上限" value={formData.capacity} onChange={(event) => setFormData({ ...formData, capacity: event.target.value })} required />
              <textarea className="input-field" rows="4" placeholder="课程说明" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
              {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}
            </div>

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={closeDrawer}>取消</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save size={18} /> 保存
              </button>
            </div>
          </form>
        </div>
      )}

      {studentsModal.open && (
        <div className="drawer-overlay">
          <div className="drawer-content" style={{ width: 'min(760px, 100vw)' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <div>
                <h2 style={{ marginBottom: '6px' }}>查看选课学生</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {studentsModal.course?.name || '-'}
                </div>
              </div>
              <button type="button" onClick={closeStudentsModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="关闭">
                <X size={24} />
              </button>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
              {studentsModal.loading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>选课学生加载中...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>学号</th>
                        <th>姓名</th>
                        <th>性别</th>
                        <th>年龄</th>
                        <th>专业</th>
                        <th>联系电话</th>
                        <th>选课时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsModal.students.map((student) => (
                        <tr key={student.id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{student.id}</td>
                          <td style={{ fontWeight: 600 }}>{student.name}</td>
                          <td>{student.gender}</td>
                          <td>{student.age}</td>
                          <td>{student.major}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{student.phone || '-'}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{student.selected_at || '-'}</td>
                        </tr>
                      ))}
                      {studentsModal.students.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-dim)' }}>
                            暂无学生选择该课程。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
