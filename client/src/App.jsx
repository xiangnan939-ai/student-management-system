import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import CourseManagement from './pages/CourseManagement';
import GradeAnalysis from './pages/GradeAnalysis';
import Settings from './pages/Settings';
import AdminAccounts from './pages/AdminAccounts';

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));
  const [currentUser, setCurrentUser] = useState(() => ({
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
            <Layout
              setIsAuthenticated={setIsAuthenticated}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
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
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
