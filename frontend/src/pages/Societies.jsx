import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar, TableContainer 
} from '@mui/material';

export default function Societies() {
  const [societies, setSocieties] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    society_name: '', 
    address: '', 
    contact_number: '', 
    email: '' 
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/societies');
      setSocieties(data);
    } catch (err) {
      setError('Failed to fetch societies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSocieties(); }, []);

  const handleOpen = (society = { 
    society_name: '', 
    address: '', 
    contact_number: '', 
    email: '' 
  }) => {
    setForm(society);
    setEditId(society.society_id || null);
    setOpen(true);
    setError('');
  };

  const handleClose = () => { 
    setOpen(false); 
    setForm({ 
      society_name: '', 
      address: '', 
      contact_number: '', 
      email: '' 
    }); 
    setEditId(null); 
    setError(''); 
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editId) {
        await api.put(`/societies/${editId}`, form);
        setSuccess('Society updated successfully');
      } else {
        await api.post('/societies', form);
        setSuccess('Society created successfully');
      }
      handleClose();
      fetchSocieties();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving society');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/societies/${id}`);
      setSuccess('Society deleted successfully');
      fetchSocieties();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting society');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Paper sx={{ width: '100%', maxWidth: '100%', mx: 0, p: 3, bgcolor: 'background.default', boxShadow: 2 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>Societies</Typography>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button 
              variant="contained" 
              onClick={() => handleOpen()} 
              disabled={loading}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Add Society
            </Button>
          </Box>
          {loading && <Typography>Loading...</Typography>}
          <TableContainer sx={{ width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell>Society Name</TableCell>
                  <TableCell>Registration Number</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {societies.map(soc => (
                  <TableRow key={soc.society_id}>
                    <TableCell>{soc.society_name}</TableCell>
                    <TableCell>{soc.registration_number}</TableCell>
                    <TableCell>{soc.contact_number || '-'}</TableCell>
                    <TableCell>{soc.email || '-'}</TableCell>
                    <TableCell>{soc.status}</TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => handleOpen(soc)}
                        disabled={loading}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button 
                        color="error" 
                        onClick={() => handleDelete(soc.society_id)}
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
          </TableContainer>

          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editId ? 'Edit Society' : 'Add Society'}</DialogTitle>
            <DialogContent>
              <TextField
                label="Society Name *"
                value={form.society_name}
                onChange={e => setForm(f => ({ ...f, society_name: e.target.value }))}
                fullWidth margin="normal" required
              />
              <TextField
                label="Address"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                fullWidth margin="normal" multiline rows={3}
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
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained" 
                disabled={loading || !form.society_name}
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
      </Box>
    </Box>
  );
} 