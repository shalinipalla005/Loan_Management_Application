import { useState } from 'react';
import { Button, TextField, Paper, Typography, Box, Alert } from '@mui/material';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [form, setForm] = useState({
    officer_name: '',
    email: '',
    password: '',
    contact_number: '',
    designation: '',
    society_id: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/signup', form);
      setSuccess('Signup successful! Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#E7EFC7">
      <Paper style={{ maxWidth: 400, width: '100%', padding: 32 }} elevation={4}>
        <Typography variant="h5" gutterBottom>Officer Signup</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            value={form.officer_name}
            onChange={e => setForm(f => ({ ...f, officer_name: e.target.value }))}
            fullWidth margin="normal" required
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            fullWidth margin="normal" required
          />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            fullWidth margin="normal" required
          />
          <TextField
            label="Contact Number"
            value={form.contact_number}
            onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))}
            fullWidth margin="normal"
          />
          <TextField
            label="Designation"
            value={form.designation}
            onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
            fullWidth margin="normal"
          />
          {/* Optionally add society selection here */}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Sign Up</Button>
          <Button
            variant="text"
            color="primary"
            fullWidth
            sx={{ mt: 1 }}
            onClick={handleGoToLogin}
          >
            Back to Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}