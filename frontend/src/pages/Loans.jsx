import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar, MenuItem, TableContainer 
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import LoanProfileDialog from '../components/LoanProfileDialog';

export default function Loans() {
  const role = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch { return null; }
  })();

  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    member_id: '', 
    officer_id: '', 
    product_id: '', 
    loan_amount: '', 
    tenure_months: '',
    interest_rate: ''
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoan, setProfileLoan] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [loansRes, membersRes, officersRes, productsRes] = await Promise.all([
        api.get('/loans'),
        api.get('/members'),
        api.get('/loan-officers'),
        api.get('/loan-products')
      ]);
      setLoans(loansRes.data);
      setMembers(membersRes.data);
      setOfficers(officersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpen = (loan = { 
    member_id: '', 
    officer_id: '', 
    product_id: '', 
    loan_amount: '', 
    tenure_months: '',
    interest_rate: ''
  }) => {
    setForm(loan);
    setEditId(loan.loan_id || null);
    setOpen(true);
    setError('');
  };

  const handleClose = () => { 
    setOpen(false); 
    setForm({ 
      member_id: '', 
      officer_id: '', 
      product_id: '', 
      loan_amount: '', 
      tenure_months: '',
      interest_rate: ''
    }); 
    setEditId(null); 
    setError(''); 
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formData = { ...form, loan_status: 'ACTIVE' };
      if (editId) {
        await api.put(`/loans/${editId}`, formData);
        setSuccess('Loan updated successfully');
      } else {
        await api.post('/loans', formData);
        setSuccess('Loan created successfully');
      }
      handleClose();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving loan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/loans/${id}`);
      setSuccess('Loan deleted successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting loan');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLoan = async (loanId) => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem('token');
      const baseURL = (window.electron && window.electron.env && window.electron.env.backendURL) || '';
      const response = await fetch(`${baseURL}/api/loans/${loanId}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export loan');
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      let filename = `loan_${loanId}_export.xlsx`;
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess('Loan exported successfully');
    } catch (err) {
      setError('Failed to export loan');
      console.error('Export error:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.member_id === memberId);
    return member ? member.member_name : 'Unknown';
  };

  const getOfficerName = (officerId) => {
    const officer = officers.find(o => o.officer_id === officerId);
    return officer ? officer.officer_name : 'Unknown';
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.product_id === productId);
    return product ? product.product_name : 'Unknown';
  };

  const handleOpenProfile = async (loanId) => {
    setProfileLoading(true);
    try {
      const { data } = await api.get(`/loanprofiles/${loanId}`);
      setProfileLoan(data.data);
      setProfileOpen(true);
    } catch (err) {
      setError('Failed to load loan profile');
      console.error('Profile error:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCloseProfile = () => {
    setProfileOpen(false);
    setProfileLoan(null);
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Paper sx={{ width: '100%', maxWidth: '100%', mx: 0, p: 3, bgcolor: 'background.default', boxShadow: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>Loans</Typography>
            {role !== 'client' && (
              <Button 
                variant="contained" 
                onClick={() => handleOpen()} 
                disabled={loading}
                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                Add Loan
              </Button>
            )}
          </Box>
          {loading && <Typography>Loading...</Typography>}
          <TableContainer sx={{ width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell>Loan Number</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>Officer</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map(loan => (
                  <TableRow key={loan.loan_id} sx={{ bgcolor: 'background.default' }}>
                    <TableCell>{loan.loan_number}</TableCell>
                    <TableCell>{getMemberName(loan.member_id)}</TableCell>
                    <TableCell>{getOfficerName(loan.officer_id)}</TableCell>
                    <TableCell>{getProductName(loan.product_id)}</TableCell>
                    <TableCell>₹{loan.loan_amount?.toLocaleString() || '-'}</TableCell>
                    <TableCell>{loan.loan_status}</TableCell>
                    <TableCell>
                      {role !== 'client' && (
                        <>
                          <Button 
                            onClick={() => handleOpen(loan)}
                            disabled={loading}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <Button 
                            color="error" 
                            onClick={() => handleDelete(loan.loan_id)}
                            disabled={loading}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      <Button 
                        onClick={() => handleOpenProfile(loan.loan_id)} 
                        disabled={loading} 
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Profile
                      </Button>
                      <Button 
                        onClick={() => handleExportLoan(loan.loan_id)}
                        disabled={exportLoading}
                        size="small"
                        startIcon={<GetAppIcon />}
                        sx={{ 
                          bgcolor: 'success.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'success.dark' },
                          '&:disabled': { bgcolor: 'grey.400' }
                        }}
                      >
                        {exportLoading ? 'Exporting...' : 'Export'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Loan Form Dialog */}
          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editId ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
            <DialogContent>
              <TextField
                select
                label="Member *"
                value={form.member_id}
                onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                fullWidth margin="normal" required
              >
                {members.map(member => (
                  <MenuItem key={member.member_id} value={member.member_id}>
                    {member.member_name} ({member.membership_number})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Loan Officer *"
                value={form.officer_id}
                onChange={e => setForm(f => ({ ...f, officer_id: e.target.value }))}
                fullWidth margin="normal" required
              >
                {officers.map(officer => (
                  <MenuItem key={officer.officer_id} value={officer.officer_id}>
                    {officer.officer_name} ({officer.employee_id})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Loan Product *"
                value={form.product_id}
                onChange={e => {
                  const selectedProduct = products.find(p => p.product_id === e.target.value);
                  setForm(f => ({ 
                    ...f, 
                    product_id: e.target.value,
                    interest_rate: selectedProduct ? selectedProduct.interest_rate : ''
                  }));
                }}
                fullWidth margin="normal" required
              >
                {products.map(product => (
                  <MenuItem key={product.product_id} value={product.product_id}>
                    {product.product_name} ({product.interest_rate}%)
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Loan Amount (₹) *"
                value={form.loan_amount}
                onChange={e => setForm(f => ({ ...f, loan_amount: e.target.value }))}
                fullWidth margin="normal" required type="number"
              />
              <TextField
                label="Interest Rate (%)"
                value={form.interest_rate}
                onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))}
                fullWidth margin="normal" type="number"
                helperText="Auto-populated from selected loan product"
              />
              <TextField
                label="Tenure (Months) *"
                value={form.tenure_months}
                onChange={e => setForm(f => ({ ...f, tenure_months: e.target.value }))}
                fullWidth margin="normal" required type="number"
              />

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained" 
                disabled={
                  loading || 
                  !form.member_id || 
                  !form.officer_id || 
                  !form.product_id || 
                  !form.loan_amount || 
                  !form.tenure_months
                }
                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar Alerts */}
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

          {/* Profile Dialog */}
          <LoanProfileDialog 
            open={profileOpen}
            onClose={handleCloseProfile}
            profileLoan={profileLoan}
            loading={profileLoading}
          />
        </Paper>
      </Box>
    </Box>
  );
}
