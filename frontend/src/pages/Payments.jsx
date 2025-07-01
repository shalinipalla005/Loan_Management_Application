import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar, MenuItem 
} from '@mui/material';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    loan_id: '', 
    payment_amount: '', 
    principal_paid: '', 
    interest_paid: '', 
    savings_paid: '', 
    penalty_paid: '', 
    payment_method: '', 
    remarks: '' 
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, loansRes] = await Promise.all([
        api.get('/payments'),
        api.get('/loans')
      ]);
      setPayments(paymentsRes.data);
      setLoans(loansRes.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpen = (payment = { 
    loan_id: '', 
    payment_amount: '', 
    principal_paid: '', 
    interest_paid: '', 
    savings_paid: '', 
    penalty_paid: '', 
    payment_method: '', 
    remarks: '' 
  }) => {
    setForm(payment);
    setEditId(payment.payment_id || null);
    setOpen(true);
    setError('');
  };

  const handleClose = () => { 
    setOpen(false); 
    setForm({ 
      loan_id: '', 
      payment_amount: '', 
      principal_paid: '', 
      interest_paid: '', 
      savings_paid: '', 
      penalty_paid: '', 
      payment_method: '', 
      remarks: '' 
    }); 
    setEditId(null); 
    setError(''); 
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editId) {
        await api.put(`/payments/${editId}`, form);
        setSuccess('Payment updated successfully');
      } else {
        await api.post('/payments', form);
        setSuccess('Payment created successfully');
      }
      handleClose();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/payments/${id}`);
      setSuccess('Payment deleted successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting payment');
    } finally {
      setLoading(false);
    }
  };

  const getLoanNumber = (loanId) => {
    const loan = loans.find(l => l.loan_id === loanId);
    return loan ? loan.loan_number : 'Unknown';
  };

  return (
    <Paper sx={{ p: 3, bgcolor: '#E7EFC7' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Payments</Typography>
        <Button 
          variant="contained" 
          onClick={() => handleOpen()} 
          disabled={loading}
          sx={{ bgcolor: '#8A784E', '&:hover': { bgcolor: '#3B3B1A' } }}
        >
          Add Payment
        </Button>
      </Box>

      {loading && <Typography>Loading...</Typography>}
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Payment ID</TableCell>
            <TableCell>Loan Number</TableCell>
            <TableCell>Payment Date</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Principal</TableCell>
            <TableCell>Interest</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map(payment => (
            <TableRow key={payment.payment_id}>
              <TableCell>{payment.payment_id}</TableCell>
              <TableCell>{getLoanNumber(payment.loan_id)}</TableCell>
              <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
              <TableCell>₹{payment.payment_amount?.toLocaleString() || '-'}</TableCell>
              <TableCell>₹{payment.principal_paid?.toLocaleString() || '-'}</TableCell>
              <TableCell>₹{payment.interest_paid?.toLocaleString() || '-'}</TableCell>
              <TableCell>{payment.payment_method || '-'}</TableCell>
              <TableCell>
                <Button 
                  onClick={() => handleOpen(payment)}
                  disabled={loading}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button 
                  color="error" 
                  onClick={() => handleDelete(payment.payment_id)}
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

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Loan *"
            value={form.loan_id}
            onChange={e => setForm(f => ({ ...f, loan_id: e.target.value }))}
            fullWidth margin="normal" required
          >
            {loans.map(loan => (
              <MenuItem key={loan.loan_id} value={loan.loan_id}>
                {loan.loan_number} - ₹{loan.loan_amount?.toLocaleString()}
              </MenuItem>
            ))}
          </TextField>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField
              label="Payment Amount (₹) *"
              value={form.payment_amount}
              onChange={e => setForm(f => ({ ...f, payment_amount: e.target.value }))}
              fullWidth required type="number"
            />
            <TextField
              label="Principal Paid (₹)"
              value={form.principal_paid}
              onChange={e => setForm(f => ({ ...f, principal_paid: e.target.value }))}
              fullWidth type="number"
            />
            <TextField
              label="Interest Paid (₹)"
              value={form.interest_paid}
              onChange={e => setForm(f => ({ ...f, interest_paid: e.target.value }))}
              fullWidth type="number"
            />
            <TextField
              label="Savings Paid (₹)"
              value={form.savings_paid}
              onChange={e => setForm(f => ({ ...f, savings_paid: e.target.value }))}
              fullWidth type="number"
            />
            <TextField
              label="Penalty Paid (₹)"
              value={form.penalty_paid}
              onChange={e => setForm(f => ({ ...f, penalty_paid: e.target.value }))}
              fullWidth type="number"
            />
            <TextField
              select
              label="Payment Method"
              value={form.payment_method}
              onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              fullWidth
            >
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="CHEQUE">Cheque</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
            </TextField>
          </Box>
          <TextField
            label="Remarks"
            value={form.remarks}
            onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
            fullWidth margin="normal" multiline rows={2}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !form.loan_id || !form.payment_amount}
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