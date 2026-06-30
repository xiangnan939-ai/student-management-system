import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import CourseManagement from './pages/CourseManagement';
import GradeAnalysis from './pages/GradeAnalysis';
import Settings from './pages/Settings';
import Architecture from './pages/Architecture';
import ConcurrencyLab from './pages/ConcurrencyLab';
import DeadlockLab from './pages/DeadlockLab';

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Layout setIsAuthenticated={setIsAuthenticated} />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/architecture" replace />} />
          <Route path="architecture" element={<Architecture />} />
          <Route path="concurrency-lab" element={<ConcurrencyLab />} />
          <Route path="deadlock-lab" element={<DeadlockLab />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="grades" element={<GradeAnalysis />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/architecture' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
