import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import PaymentSchedules from './pages/PaymentSchedules';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import Signup from './pages/Signup';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

function AppContent() {
  const isLoggedIn = !!localStorage.getItem('token');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isLoggedIn && !isLoginPage && (
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      <Box sx={{ flexGrow: 1, width: '100%', transition: 'margin 0.3s' }}>
        {isLoggedIn && !isLoginPage && (
          <AppBar position="fixed" color="inherit" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setSidebarOpen((open) => !open)}
                sx={{ mr: 2, display: { sm: 'block' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                Loan Management System
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        {isLoggedIn && !isLoginPage && <Toolbar sx={{ minHeight: 64 }} />}
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/societies" element={<PrivateRoute><Societies /></PrivateRoute>} />
            <Route path="/members" element={<PrivateRoute><Members /></PrivateRoute>} />
            <Route path="/loans" element={<PrivateRoute><Loans /></PrivateRoute>} />
            <Route path="/officers" element={<PrivateRoute><Officers /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
            <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/payment-schedules" element={<PrivateRoute><PaymentSchedules /></PrivateRoute>} />
            <Route path="/" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
