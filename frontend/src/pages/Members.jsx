import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar, MenuItem, TableContainer, Tabs, Tab 
} from '@mui/material';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    member_name: '', 
    membership_number: '', 
    contact_number: '', 
    email: '', 
    address: '',
    society_id: ''
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMember, setProfileMember] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
  const [memberDues, setMemberDues] = useState([]);
  const [loanSavings, setLoanSavings] = useState({});
  const [clearLoading, setClearLoading] = useState(false);
  const userRole = localStorage.getItem('role'); // or get from context/auth

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

  const fetchSocieties = async () => {
    try {
      const { data } = await api.get('/societies');
      setSocieties(data);
    } catch {
      setSocieties([]);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleOpen = (member = { 
    member_name: '', 
    membership_number: '', 
    contact_number: '', 
    email: '', 
    address: '',
    society_id: ''
  }) => {
    setForm(member);
    setEditId(member.member_id || null);
    setOpen(true);
    setError('');
    fetchSocieties();
  };

  const handleClose = () => { 
    setOpen(false); 
    setForm({ 
      member_name: '', 
      membership_number: '', 
      contact_number: '', 
      email: '', 
      address: '',
      society_id: ''
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

  const fetchMemberDues = async (memberId) => {
    const { data } = await api.get(`/members/${memberId}/dues`);
    setMemberDues(data);
  };

  const fetchLoanSavings = async (loanId) => {
    const { data } = await api.get(`/loans/${loanId}/savings`);
    setLoanSavings((prev) => ({ ...prev, [loanId]: data.totalSavings }));
  };

  const handleClearLoan = async (loanId) => {
    setClearLoading(true);
    try {
      await api.patch(`/loans/${loanId}/clear`);
      await handleOpenProfile(profileMember.member_id); // refresh
    } finally {
      setClearLoading(false);
    }
  };

  const handleOpenProfile = async (memberId) => {
    setProfileLoading(true);
    try {
      const { data } = await api.get(`/loans/members/${memberId}`);
      setProfileMember(data.data);
      await fetchMemberDues(memberId);
      // Fetch savings for each loan
      if (data.data.loans) {
        for (const loan of data.data.loans) {
          await fetchLoanSavings(loan.loan_id);
        }
      }
      setProfileOpen(true);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCloseProfile = () => {
    setProfileOpen(false);
    setProfileMember(null);
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Paper sx={{ width: '100%', maxWidth: '100%', mx: 0, p: 3, bgcolor: 'background.default', boxShadow: 2 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>Members</Typography>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button 
              variant="contained" 
              onClick={() => handleOpen()} 
              disabled={loading}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Add Member
            </Button>
          </Box>
          {loading && <Typography>Loading...</Typography>}
          <TableContainer sx={{ width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
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
                      <Button onClick={() => handleOpenProfile(mem.member_id)} disabled={loading} size="small">Profile</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

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
              <TextField
                select
                label="Society *"
                value={form.society_id}
                onChange={e => setForm(f => ({ ...f, society_id: e.target.value }))}
                fullWidth margin="normal" required
              >
                {societies.map(soc => (
                  <MenuItem key={soc.society_id} value={soc.society_id}>
                    {soc.society_name} ({soc.registration_number})
                  </MenuItem>
                ))}
              </TextField>
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

          <Dialog open={profileOpen} onClose={handleCloseProfile} maxWidth="lg" fullWidth>
            <DialogTitle>Member Profile</DialogTitle>
            <DialogContent>
              {profileLoading || !profileMember ? <Typography>Loading...</Typography> : (
                <Box>
                  <Typography variant="h6">{profileMember.member_name}</Typography>
                  <Typography>Membership #: {profileMember.membership_number}</Typography>
                  <Typography>Contact: {profileMember.contact_number}</Typography>
                  <Typography>Email: {profileMember.email}</Typography>
                  <Tabs value={profileTab} onChange={(_, v) => setProfileTab(v)} sx={{ mb: 2 }}>
                    <Tab label="Active Loans" />
                    <Tab label="Cleared Loans" />
                    <Tab label="Dues" />
                    <Tab label="Savings" />
                  </Tabs>
                  {profileTab === 0 && (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Loan #</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Outstanding Principal</TableCell>
                          <TableCell>Outstanding Interest</TableCell>
                          <TableCell>Savings</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(profileMember.loans || []).filter(l => !l.cleared_by_official).map(loan => (
                          <TableRow key={loan.loan_id}>
                            <TableCell>{loan.loan_number}</TableCell>
                            <TableCell>{loan.loan_amount}</TableCell>
                            <TableCell>{loan.loan_status}</TableCell>
                            <TableCell>{loan.outstanding_principal}</TableCell>
                            <TableCell>{loan.outstanding_interest}</TableCell>
                            <TableCell>{loanSavings[loan.loan_id] || 0}</TableCell>
                            <TableCell>
                              {userRole === 'admin' || userRole === 'official' ? (
                                !loan.cleared_by_official && (
                                  <Button size="small" color="success" onClick={() => handleClearLoan(loan.loan_id)} disabled={clearLoading}>
                                    Clear Loan
                                  </Button>
                                )
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {profileTab === 1 && (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Loan #</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Cleared At</TableCell>
                          <TableCell>Savings Returned</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(profileMember.loans || []).filter(l => l.cleared_by_official).map(loan => (
                          <TableRow key={loan.loan_id}>
                            <TableCell>{loan.loan_number}</TableCell>
                            <TableCell>{loan.loan_amount}</TableCell>
                            <TableCell>{loan.loan_status}</TableCell>
                            <TableCell>{loan.cleared_at ? new Date(loan.cleared_at).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{loanSavings[loan.loan_id] || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {profileTab === 2 && (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Loan #</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {memberDues.map(due => (
                          <TableRow key={due.schedule_id} sx={{ bgcolor: due.payment_status === 'PAID' ? '#d0f5e8' : due.payment_status === 'PARTIAL' ? '#fff9c4' : '#ffebee' }}>
                            <TableCell>{due.loan_id}</TableCell>
                            <TableCell>{due.due_date ? new Date(due.due_date).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{due.total_installment}</TableCell>
                            <TableCell>{due.payment_status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {profileTab === 3 && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>Total Savings by Loan</Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Loan #</TableCell>
                            <TableCell>Total Savings</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(profileMember.loans || []).map(loan => (
                            <TableRow key={loan.loan_id}>
                              <TableCell>{loan.loan_number}</TableCell>
                              <TableCell>{loanSavings[loan.loan_id] || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseProfile}>Close</Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
    </Box>
  );
} 