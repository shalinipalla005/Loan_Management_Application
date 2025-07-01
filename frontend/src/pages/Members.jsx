import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar 
} from '@mui/material';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    member_name: '', 
    membership_number: '', 
    contact_number: '', 
    email: '', 
    address: '' 
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/members');
      setMembers(data);
    } catch (err) {
      setError('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleOpen = (member = { 
    member_name: '', 
    membership_number: '', 
    contact_number: '', 
    email: '', 
    address: '' 
  }) => {
    setForm(member);
    setEditId(member.member_id || null);
    setOpen(true);
    setError('');
  };

  const handleClose = () => { 
    setOpen(false); 
    setForm({ 
      member_name: '', 
      membership_number: '', 
      contact_number: '', 
      email: '', 
      address: '' 
    }); 
    setEditId(null); 
    setError(''); 
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editId) {
        await api.put(`/members/${editId}`, form);
        setSuccess('Member updated successfully');
      } else {
        await api.post('/members', form);
        setSuccess('Member created successfully');
      }
      handleClose();
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving member');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/members/${id}`);
      setSuccess('Member deleted successfully');
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, bgcolor: '#E7EFC7' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Members</Typography>
        <Button 
          variant="contained" 
          onClick={() => handleOpen()} 
          disabled={loading}
          sx={{ bgcolor: '#8A784E', '&:hover': { bgcolor: '#3B3B1A' } }}
        >
          Add Member
        </Button>
      </Box>

      {loading && <Typography>Loading...</Typography>}
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Membership #</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map(mem => (
            <TableRow key={mem.member_id}>
              <TableCell>{mem.member_name}</TableCell>
              <TableCell>{mem.membership_number}</TableCell>
              <TableCell>{mem.contact_number || '-'}</TableCell>
              <TableCell>{mem.email || '-'}</TableCell>
              <TableCell>{mem.status}</TableCell>
              <TableCell>
                <Button 
                  onClick={() => handleOpen(mem)}
                  disabled={loading}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button 
                  color="error" 
                  onClick={() => handleDelete(mem.member_id)}
                  disabled={loading}
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
        <DialogTitle>{editId ? 'Edit Member' : 'Add Member'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name *"
            value={form.member_name}
            onChange={e => setForm(f => ({ ...f, member_name: e.target.value }))}
            fullWidth margin="normal" required
          />
          <TextField
            label="Contact Number"
            value={form.contact_number}
            onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))}
            fullWidth margin="normal"
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            fullWidth margin="normal" type="email"
          />
          <TextField
            label="Address"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            fullWidth margin="normal" multiline rows={3}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !form.member_name}
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