import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Societies from './pages/Societies';
import Members from './pages/Members';
import Loans from './pages/Loans';
import Officers from './pages/Officers';
import Products from './pages/Products';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      {localStorage.getItem('token') && <Sidebar />}
      <div style={{ marginLeft: localStorage.getItem('token') ? 240 : 0, padding: 24 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/societies" element={<PrivateRoute><Societies /></PrivateRoute>} />
          <Route path="/members" element={<PrivateRoute><Members /></PrivateRoute>} />
          <Route path="/loans" element={<PrivateRoute><Loans /></PrivateRoute>} />
          <Route path="/officers" element={<PrivateRoute><Officers /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/" element={<Navigate to={localStorage.getItem('token') ? '/dashboard' : '/login'} />} />
        </Routes>
      </div>
    </Router>
  );
}
