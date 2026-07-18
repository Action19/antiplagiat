import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CheckDocument from './pages/CheckDocument';
import Results from './pages/Results';
import DocumentDetail from './pages/DocumentDetail';
import AdminPanel from './pages/AdminPanel';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner w-12 h-12"></div></div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user, isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/check" element={<PrivateRoute><CheckDocument /></PrivateRoute>} />
      <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
      <Route path="/documents/:id" element={<PrivateRoute><DocumentDetail /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute>{isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />}</PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
