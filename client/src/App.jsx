import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import StudentLayout from './components/StudentLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import CourseManagement from './pages/CourseManagement';
import GradeAnalysis from './pages/GradeAnalysis';
import Settings from './pages/Settings';
import AdminAccounts from './pages/AdminAccounts';
import StudentCourseSelection from './pages/StudentCourseSelection';
import StudentSettings from './pages/StudentSettings';

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const RoleRoute = ({ role, expectedRole, redirectTo, children }) => {
  if (role !== expectedRole) return <Navigate to={redirectTo} replace />;
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));
  const [currentUser, setCurrentUser] = useState(() => ({
    role: localStorage.getItem('role') || (localStorage.getItem('token') ? 'admin' : ''),
    username: localStorage.getItem('username') || '',
    name: localStorage.getItem('displayName') || '',
    isAdmin: localStorage.getItem('isAdmin') === 'true',
  }));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />} />
        <Route path="/" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <RoleRoute role={currentUser.role} expectedRole="admin" redirectTo="/student/course-selection">
              <Layout
                setIsAuthenticated={setIsAuthenticated}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
              />
            </RoleRoute>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="grades" element={<GradeAnalysis />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="admin-accounts"
            element={currentUser?.username === 'admin' ? <AdminAccounts /> : <Navigate to="/dashboard" replace />}
          />
        </Route>
        <Route path="/student" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <RoleRoute role={currentUser.role} expectedRole="student" redirectTo="/dashboard">
              <StudentLayout
                setIsAuthenticated={setIsAuthenticated}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
              />
            </RoleRoute>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/student/course-selection" replace />} />
          <Route path="course-selection" element={<StudentCourseSelection />} />
          <Route path="settings" element={<StudentSettings setCurrentUser={setCurrentUser} />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? (currentUser.role === 'student' ? '/student/course-selection' : '/dashboard') : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
