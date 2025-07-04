import { useState, useEffect } from 'react';
import { Button, TextField, Paper, Typography, Link as MuiLink, Box, MenuItem } from '@mui/material';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

export default function Register({ setIsAuthenticated }) {
  const [form, setForm] = useState({ member_name: '', password: '', society_id: '' });
  const [societies, setSocieties] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const original = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#E7EFC7';
    api.get('/societies').then(res => setSocieties(res.data)).catch(() => setSocieties([]));
    return () => { document.body.style.backgroundColor = original; };
  }, []);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" width="100vw">
        <Paper style={{ background: theme.palette.background.default, maxWidth: 400, width: '100%', padding: 32 }} elevation={4}>
          <Typography variant="h5" gutterBottom>Register</Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Name"
              name="member_name"
              value={form.member_name}
              onChange={handleChange}
              fullWidth margin="normal"
              autoFocus
            />
            <TextField
              select
              label="Society"
              name="society_id"
              value={form.society_id}
              onChange={handleChange}
              fullWidth margin="normal"
              required
            >
              {societies.map(soc => (
                <MenuItem key={soc.society_id} value={soc.society_id}>
                  {soc.society_name} ({soc.registration_number})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth margin="normal"
            />
            {error && <Typography color="error">{error}</Typography>}
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Register</Button>
          </form>
          <Typography align="center" sx={{ mt: 2 }}>
            Already have an account?{' '}
            <MuiLink component={Link} to="/login" underline="hover" color="secondary">
              Login
            </MuiLink>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
} 