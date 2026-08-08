import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import StudentLayout from './components/StudentLayout';
import LiquidGlassInteraction from './components/LiquidGlassInteraction';
import LiquidGlassFilters from './components/LiquidGlassFilters';
import MatrixRain from './components/MatrixRain';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import CourseManagement from './pages/CourseManagement';
import Settings from './pages/Settings';
import AdminAccounts from './pages/AdminAccounts';
import SystemLogs from './pages/SystemLogs';
import StudentCourseSelection from './pages/StudentCourseSelection';
import StudentSettings from './pages/StudentSettings';
import { applyTheme, DEFAULT_THEME, getStoredTheme, normalizeTheme } from './themes';
import { getStoredUser } from './api';

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const RoleRoute = ({ role, expectedRole, redirectTo, children }) => {
  if (role !== expectedRole) return <Navigate to={redirectTo} replace />;
  return children;
};

const AppRoutes = ({ isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser }) => {
  const location = useLocation();
  useEffect(() => {
    const isLoginPage = location.pathname === '/login';
    applyTheme(isLoginPage ? DEFAULT_THEME : currentUser.theme || getStoredTheme());
  }, [currentUser.theme, location.pathname]);

  return (
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
        <Route
          path="settings"
          element={
            <Settings
              currentUser={{ ...currentUser, theme: normalizeTheme(currentUser.theme) }}
              setCurrentUser={setCurrentUser}
            />
          }
        />
        <Route
          path="admin-accounts"
          element={currentUser?.username === 'admin' ? <AdminAccounts /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="system-logs" element={<SystemLogs />} />
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
        <Route
          path="settings"
          element={<StudentSettings currentUser={currentUser} setCurrentUser={setCurrentUser} />}
        />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? (currentUser.role === 'student' ? '/student/course-selection' : '/dashboard') : '/login'} replace />}
      />
    </Routes>
  );
};

function App() {
  const initialUser = getStoredUser();
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(initialUser.role));
  const [currentUser, setCurrentUser] = useState(() => ({
    role: initialUser.role,
    username: initialUser.username,
    name: initialUser.name,
    theme: getStoredTheme(),
    isAdmin: initialUser.isAdmin,
  }));

  return (
    <BrowserRouter>
      <LiquidGlassFilters />
      <MatrixRain />
      <LiquidGlassInteraction />
      <AppRoutes
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
    </BrowserRouter>
  );
}

export default App;
