import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar, MenuItem, TableContainer 
} from '@mui/material';

export default function Payments() {
  const role = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch { return null; }
  })();
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
  const [loanDues, setLoanDues] = useState({});

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

  const handleOpen = async (payment = { 
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
    
    // If editing existing payment, don't fetch loan dues
    if (payment.payment_id) {
      setLoanDues({});
      return;
    }
    
    // For new payments, fetch the next installment details
    if (payment.loan_id) {
      try {
        const { data } = await api.get(`/loanprofiles/${payment.loan_id}`);
        const loan = data.data;
        
        // Find next due schedule (first unpaid or partially paid)
        const nextDue = loan.repaymentSchedule?.find(sch => 
          sch.payment_status === 'PENDING' || 
          sch.payment_status === 'OVERDUE' || 
          sch.payment_status === 'PARTIAL'
        );
        
        if (nextDue) {
          // Calculate remaining amounts for this installment
          const alreadyPaid = parseFloat(nextDue.paid_amount || 0);
          const totalInstallment = parseFloat(nextDue.total_installment || 0);
          const remainingAmount = Math.max(0, totalInstallment - alreadyPaid);
          
          // Calculate remaining breakdown
          const remainingPrincipal = Math.max(0, parseFloat(nextDue.principal_amount || 0) - alreadyPaid);
          const remainingInterest = Math.max(0, parseFloat(nextDue.interest_amount || 0) - alreadyPaid);
          const remainingSavings = Math.max(0, parseFloat(nextDue.monthly_savings || 0) - alreadyPaid);
          const remainingPenalty = Math.max(0, parseFloat(nextDue.penalty_applied || 0) - alreadyPaid);
          
          setLoanDues({
            principal: remainingPrincipal,
            interest: remainingInterest,
            savings: remainingSavings,
            penalty: remainingPenalty,
            total: remainingAmount,
            installment: nextDue.installment_number,
            dueDate: nextDue.due_date
          });
          
          // Pre-fill form with remaining amounts
          setForm(f => ({
            ...f,
            principal_paid: remainingPrincipal,
            interest_paid: remainingInterest,
            savings_paid: remainingSavings,
            penalty_paid: remainingPenalty,
            payment_amount: remainingAmount
          }));
        } else {
          setLoanDues({});
        }
      } catch (err) {
        console.error('Error fetching loan details:', err);
        setError('Failed to fetch loan details');
        setLoanDues({});
      }
    } else {
      setLoanDues({});
    }
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
    setLoanDues({});
  };

  // Auto-calculate total payment amount when individual amounts change
  const updatePaymentAmount = (field, value) => {
    const newForm = { ...form, [field]: value };
    const total = (parseFloat(newForm.principal_paid || 0) + 
                  parseFloat(newForm.interest_paid || 0) + 
                  parseFloat(newForm.savings_paid || 0) + 
                  parseFloat(newForm.penalty_paid || 0)).toFixed(2);
    setForm({ ...newForm, payment_amount: total });
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
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Paper sx={{ width: '100%', maxWidth: '100%', mx: 0, p: 3, bgcolor: 'background.default', boxShadow: 2 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>Payments</Typography>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button 
                variant="contained" 
                onClick={() => handleOpen()} 
                disabled={loading === true || role === 'client'}
                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
              >
              Add Payment
            </Button>
          </Box>
          {loading && <Typography>Loading...</Typography>}
          <TableContainer sx={{ width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
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
                        disabled={loading === true || role === 'client'}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button 
                        color="error" 
                        onClick={() => handleDelete(payment.payment_id)}
                        disabled={loading === true || role === 'client'}
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

          <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>{editId ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
            <DialogContent>
              {loanDues && loanDues.installment && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Next Due - Installment #{loanDues.installment} (Due: {new Date(loanDues.dueDate).toLocaleDateString()})
                  </Typography>
                  <Typography variant="body2">
                    Principal: ₹{loanDues.principal?.toLocaleString() || '0'}, 
                    Interest: ₹{loanDues.interest?.toLocaleString() || '0'}, 
                    Savings: ₹{loanDues.savings?.toLocaleString() || '0'}, 
                    Penalty: ₹{loanDues.penalty?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                    Total Due: ₹{loanDues.total?.toLocaleString() || '0'}
                  </Typography>
                </Alert>
              )}
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
                  onChange={e => {
                    const total = parseFloat(e.target.value || 0);
                    const currentBreakdown = (parseFloat(form.principal_paid || 0) + 
                                            parseFloat(form.interest_paid || 0) + 
                                            parseFloat(form.savings_paid || 0) + 
                                            parseFloat(form.penalty_paid || 0));
                    
                    if (currentBreakdown > 0) {
                      // Proportionally distribute the new total
                      const ratio = total / currentBreakdown;
                      setForm(f => ({
                        ...f,
                        payment_amount: e.target.value,
                        principal_paid: (parseFloat(f.principal_paid || 0) * ratio).toFixed(2),
                        interest_paid: (parseFloat(f.interest_paid || 0) * ratio).toFixed(2),
                        savings_paid: (parseFloat(f.savings_paid || 0) * ratio).toFixed(2),
                        penalty_paid: (parseFloat(f.penalty_paid || 0) * ratio).toFixed(2)
                      }));
                    } else {
                      setForm(f => ({ ...f, payment_amount: e.target.value }));
                    }
                  }}
                  fullWidth required type="number"
                />
                <TextField
                  label="Principal Paid (₹)"
                  value={form.principal_paid}
                  onChange={e => updatePaymentAmount('principal_paid', e.target.value)}
                  fullWidth type="number"
                />
                <TextField
                  label="Interest Paid (₹)"
                  value={form.interest_paid}
                  onChange={e => updatePaymentAmount('interest_paid', e.target.value)}
                  fullWidth type="number"
                />
                <TextField
                  label="Savings Paid (₹)"
                  value={form.savings_paid}
                  onChange={e => updatePaymentAmount('savings_paid', e.target.value)}
                  fullWidth type="number"
                />
                <TextField
                  label="Penalty Paid (₹)"
                  value={form.penalty_paid}
                  onChange={e => updatePaymentAmount('penalty_paid', e.target.value)}
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
              {form.payment_amount && loanDues.total && (
                parseFloat(form.payment_amount) < parseFloat(loanDues.total) && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Payment amount (₹{parseFloat(form.payment_amount).toLocaleString()}) is less than total due (₹{parseFloat(loanDues.total).toLocaleString()}) for this installment.
                  </Alert>
                )
              )}
              {form.payment_amount && loanDues.total && (
                parseFloat(form.payment_amount) > parseFloat(loanDues.total) && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Payment amount (₹{parseFloat(form.payment_amount).toLocaleString()}) exceeds total due (₹{parseFloat(loanDues.total).toLocaleString()}) for this installment. Excess amount will be applied to the next installment.
                  </Alert>
                )
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} disabled={loading === true}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained" 
                disabled={loading === true || !form.loan_id || !form.payment_amount}
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