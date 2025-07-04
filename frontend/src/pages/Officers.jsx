import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert
} from '@mui/material';

// Helper to decode JWT and extract role
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
  const [societies, setSocieties] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const role = getOfficerRole();

  const [form, setForm] = useState({
    officer_name: '',
    email: '',
    password: '',
    contact_number: '',
    designation: '',
    society_id: '',
  });

  useEffect(() => {
    fetchOfficers();
    if (role === 'admin') {
      fetchSocieties();
    }
  }, [role]);

  const fetchOfficers = async () => {
    try {
      const { data } = await api.get('/loan-officers');
      setOfficers(data);
    } catch {
      setError('Failed to fetch officers');
    }
  };

  const fetchSocieties = async () => {
    try {
      const { data } = await api.get('/societies');
      setSocieties(data);
    } catch {
      setSocieties([]);
    }
  };

  const handleAddOfficer = async () => {
    setAddError('');
    setAddLoading(true);
    try {
      await api.post('/loan-officers', form);
      setOpen(false);
      setForm({
        officer_name: '',
        email: '',
        password: '',
        contact_number: '',
        designation: '',
        society_id: '',
      });
      fetchOfficers();
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add officer');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Paper sx={{ width: '100%', maxWidth: '100%', mx: 0, p: 3, bgcolor: 'background.default', boxShadow: 2 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
            All Officers
          </Typography>

          <Box display="flex" justifyContent="flex-end" mb={2}>
            {role === 'admin' && (
              <Button
                variant="contained"
                onClick={() => setOpen(true)}
                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                Add Officer
              </Button>
            )}
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <TableContainer sx={{ width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
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

          {/* Add Officer Dialog */}
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
