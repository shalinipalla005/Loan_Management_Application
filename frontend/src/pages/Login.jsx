import { useState } from 'react';
import { Button, TextField, Paper, Typography, Box } from '@mui/material';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [identifier, setIdentifier] = useState(''); // employee_id or email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#E7EFC7">
      <Paper style={{ maxWidth: 400, width: '100%', padding: 32 }} elevation={4}>
        <Typography variant="h5" gutterBottom>Officer Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Employee ID or Email"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            fullWidth margin="normal"
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth margin="normal"
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Login</Button>
        </form>
      </Paper>
    </Box>
  );
} 