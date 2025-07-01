import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar, MenuItem 
} from '@mui/material';

export default function Loans() {
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
      if (editId) {
        await api.put(`/loans/${editId}`, form);
        setSuccess('Loan updated successfully');
      } else {
        await api.post('/loans', form);
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

  return (
    <Paper sx={{ p: 3, bgcolor: '#E7EFC7' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Loans</Typography>
        <Button 
          variant="contained" 
          onClick={() => handleOpen()} 
          disabled={loading}
          sx={{ bgcolor: '#8A784E', '&:hover': { bgcolor: '#3B3B1A' } }}
        >
          Add Loan
        </Button>
      </Box>

      {loading && <Typography>Loading...</Typography>}
      
      <Table>
        <TableHead>
          <TableRow>
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
            <TableRow key={loan.loan_id}>
              <TableCell>{loan.loan_number}</TableCell>
              <TableCell>{getMemberName(loan.member_id)}</TableCell>
              <TableCell>{getOfficerName(loan.officer_id)}</TableCell>
              <TableCell>{getProductName(loan.product_id)}</TableCell>
              <TableCell>₹{loan.loan_amount?.toLocaleString() || '-'}</TableCell>
              <TableCell>{loan.loan_status}</TableCell>
              <TableCell>
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
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
            onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
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
            label="Interest Rate (%) *"
            value={form.interest_rate}
            onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))}
            fullWidth margin="normal" required type="number"
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
            disabled={loading || !form.member_id || !form.officer_id || !form.product_id || !form.loan_amount || !form.tenure_months || !form.interest_rate}
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