import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Paper, Typography, Box, Alert, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';

// Helper to get role from token
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
  const [societies, setSocieties] = useState([]); // <-- Add societies state
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false); // For Add Officer dialog
  const role = getOfficerRole();

  useEffect(() => {
    async function fetchOfficers() {
      try {
        const { data } = await api.get('/loan-officers');
        setOfficers(data);
      } catch {
        setError('Failed to fetch officers');
      }
    }
    fetchOfficers();
  }, []);

  // Fetch societies for admin
  useEffect(() => {
    if (role === 'admin') {
      api.get('/societies')
        .then(res => setSocieties(res.data))
        .catch(() => setSocieties([]));
    }
  }, [role]);

  // Add Officer dialog logic (only for admin)
  const [form, setForm] = useState({
    officer_name: '',
    email: '',
    password: '',
    contact_number: '',
    designation: '',
    society_id: '',
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const handleAddOfficer = async () => {
    setAddError('');
    setAddLoading(true);
    try {
      await api.post('/loan-officers', form);
      setOpen(false);
      setForm({ officer_name: '', email: '', password: '', contact_number: '', designation: '', society_id: '' });
      // Refresh officers list
      const { data } = await api.get('/loan-officers');
      setOfficers(data);
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add officer');
    }
    setAddLoading(false);
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Paper sx={{ width: '100%', maxWidth: 1100, mx: 'auto', mt: 6, p: 3, boxShadow: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>All Officers</Typography>
            {role === 'admin' && (
              <Button variant="contained" onClick={() => setOpen(true)}>
                Add Officer
              </Button>
            )}
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Society ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {officers.map(officer => (
                  <TableRow key={officer.officer_id}>
                    <TableCell>{officer.officer_name}</TableCell>
                    <TableCell>{officer.employee_id}</TableCell>
                    <TableCell>{officer.email}</TableCell>
                    <TableCell>{officer.contact_number || '-'}</TableCell>
                    <TableCell>{officer.designation || '-'}</TableCell>
                    <TableCell>{officer.status}</TableCell>
                    <TableCell>{officer.role}</TableCell>
                    <TableCell>{officer.society_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add Officer Dialog (admin only) */}
          <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add Officer</DialogTitle>
            <DialogContent>
              <TextField
                label="Name"
                value={form.officer_name}
                onChange={e => setForm(f => ({ ...f, officer_name: e.target.value }))}
                fullWidth margin="normal" required
              />
              <TextField
                label="Email"
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
              {role === 'admin' ? (
                <TextField
                  select
                  label="Society"
                  value={form.society_id}
                  onChange={e => setForm(f => ({ ...f, society_id: e.target.value }))}
                  fullWidth margin="normal" required
                >
                  {societies.map(soc => (
                    <MenuItem key={soc.society_id} value={soc.society_id}>
                      {soc.society_name}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  label="Society ID"
                  value={form.society_id}
                  onChange={e => setForm(f => ({ ...f, society_id: e.target.value }))}
                  fullWidth margin="normal"
                />
              )}
              {addError && <Alert severity="error" sx={{ mt: 2 }}>{addError}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)} disabled={addLoading}>Cancel</Button>
              <Button onClick={handleAddOfficer} variant="contained" disabled={addLoading}>
                {addLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
    </Box>
  );
}