import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar 
} from '@mui/material';

function getOfficerRole() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

export default function Officers() {
  const [officers, setOfficers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    officer_name: '', 
    contact_number: '', 
    email: '', 
    designation: '' 
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const role = getOfficerRole();
  const isAdmin = role === 'admin';

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/loan-officers');
      setOfficers(data);
    } catch (err) {
      setError('Failed to fetch officers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOfficers(); }, []);

  const handleOpen = (officer = { 
    officer_name: '', 
    contact_number: '', 
    email: '', 
    designation: '' 
  }) => {
    setForm(officer);
    setEditId(officer.officer_id || null);
    setOpen(true);
    setError('');
  };

  const handleClose = () => { 
    setOpen(false); 
    setForm({ 
      officer_name: '', 
      contact_number: '', 
      email: '', 
      designation: '' 
    }); 
    setEditId(null); 
    setError(''); 
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editId) {
        await api.put(`/loan-officers/${editId}`, form);
        setSuccess('Officer updated successfully');
      } else {
        await api.post('/loan-officers', form);
        setSuccess('Officer created successfully');
      }
      handleClose();
      fetchOfficers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving officer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/loan-officers/${id}`);
      setSuccess('Officer deleted successfully');
      fetchOfficers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting officer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, bgcolor: '#E7EFC7' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Loan Officers</Typography>
        <Button 
          variant="contained" 
          onClick={() => handleOpen()} 
          disabled={loading || !isAdmin}
          sx={{ bgcolor: '#8A784E', '&:hover': { bgcolor: '#3B3B1A' } }}
        >
          Add Officer
        </Button>
      </Box>
      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Only admins can add, edit, or delete officers. You have view-only access.
        </Alert>
      )}
      {loading && <Typography>Loading...</Typography>}
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Employee ID</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Designation</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {officers.map(off => (
            <TableRow key={off.officer_id}>
              <TableCell>{off.officer_name}</TableCell>
              <TableCell>{off.employee_id}</TableCell>
              <TableCell>{off.contact_number || '-'}</TableCell>
              <TableCell>{off.email || '-'}</TableCell>
              <TableCell>{off.designation || '-'}</TableCell>
              <TableCell>{off.status}</TableCell>
              <TableCell>
                <Button 
                  onClick={() => handleOpen(off)}
                  disabled={loading || !isAdmin}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button 
                  color="error" 
                  onClick={() => handleDelete(off.officer_id)}
                  disabled={loading || !isAdmin}
                  size="small"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Officer' : 'Add Officer'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Officer Name *"
            value={form.officer_name}
            onChange={e => setForm(f => ({ ...f, officer_name: e.target.value }))}
            fullWidth margin="normal" required
            disabled={!isAdmin}
          />
          <TextField
            label="Contact Number"
            value={form.contact_number}
            onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))}
            fullWidth margin="normal"
            disabled={!isAdmin}
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            fullWidth margin="normal" type="email"
            disabled={!isAdmin}
          />
          <TextField
            label="Designation"
            value={form.designation}
            onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
            fullWidth margin="normal"
            disabled={!isAdmin}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !form.officer_name || !isAdmin}
            sx={{ bgcolor: '#8A784E', '&:hover': { bgcolor: '#3B3B1A' } }}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
} 