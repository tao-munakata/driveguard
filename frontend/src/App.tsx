import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DriverHome from './pages/DriverHome';
import AlcoholCheck from './pages/AlcoholCheck';
import ReportForm from './pages/ReportForm';
import RecordList from './pages/RecordList';
import RecordDetail from './pages/RecordDetail';
import AdminDashboard from './pages/AdminDashboard';

function RequireAuth({ children, role }: { children: JSX.Element; role?: string }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">読み込み中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'manager' ? '/admin' : '/home'} replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">読み込み中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'manager' ? '/admin' : '/home'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={
            <RequireAuth role="driver"><DriverHome /></RequireAuth>
          } />
          <Route path="/alcohol-check" element={
            <RequireAuth role="driver"><AlcoholCheck /></RequireAuth>
          } />
          <Route path="/report/new" element={
            <RequireAuth role="driver"><ReportForm /></RequireAuth>
          } />
          <Route path="/records" element={
            <RequireAuth><RecordList /></RequireAuth>
          } />
          <Route path="/records/:id" element={
            <RequireAuth><RecordDetail /></RequireAuth>
          } />
          <Route path="/admin" element={
            <RequireAuth role="manager"><AdminDashboard /></RequireAuth>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
