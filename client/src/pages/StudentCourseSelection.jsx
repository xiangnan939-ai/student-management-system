import { useEffect, useState } from 'react';
import { BookOpenCheck, RefreshCw, Undo2 } from 'lucide-react';
import { authHeaders } from '../api';

const StudentCourseSelection = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operatingId, setOperatingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/student/courses', { headers: authHeaders() });
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
        const response = await fetch('/api/student/courses', { headers: authHeaders() });
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

  const toggleCourse = async (course) => {
    setOperatingId(course.id);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/student/courses/${course.id}/select`, {
        method: Number(course.selected) === 1 ? 'DELETE' : 'POST',
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '操作失败');

      setMessage(data.message);
      fetchCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setOperatingId(null);
    }
  };

  const remain = (course) => Math.max(Number(course.capacity || 0) - Number(course.selected_count || 0), 0);

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>选课管理</h1>
          <p style={{ color: 'var(--text-muted)' }}>查看可选课程并管理自己的选课记录</p>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchCourses} disabled={loading}>
          <RefreshCw size={18} /> 刷新
        </button>
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
                  <th>人数上限</th>
                  <th>已选人数</th>
                  <th>剩余名额</th>
                  <th>状态</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const selected = Number(course.selected) === 1;
                  const full = remain(course) <= 0 && !selected;

                  return (
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
                      <td>
                        <span className={`badge ${selected ? 'badge-blue' : full ? 'badge-orange' : 'badge-green'}`}>
                          {selected ? '已选' : full ? '已满' : '可选'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={selected ? 'btn-secondary' : 'btn-primary'}
                          disabled={operatingId === course.id || full}
                          onClick={() => toggleCourse(course)}
                          style={{ padding: '8px 14px' }}
                        >
                          {selected ? <Undo2 size={16} /> : <BookOpenCheck size={16} />}
                          {selected ? '退选' : '选择'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                      暂无可选课程。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourseSelection;
