import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar, MenuItem, TableContainer 
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

function ProfileField({ label, value }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value ?? '-'}</Typography>
    </Box>
  );
}

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

  const handleExportLoan = async (loanId) => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/loans/${loanId}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export loan');
      }

      const blob = await response.blob();
      
      // Get filename from response headers
      const disposition = response.headers.get('Content-Disposition');
      let filename = `loan_${loanId}_export.xlsx`;
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }

      // Create download link
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
      const { data } = await api.get(`/loans/${loanId}`);
      setProfileLoan(data.data);
      setProfileOpen(true);
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
            <Button 
              variant="contained" 
              onClick={() => handleOpen()} 
              disabled={loading}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Add Loan
            </Button>
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
                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
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
            <DialogTitle>Loan Profile</DialogTitle>
            <DialogContent>
              {profileLoading || !profileLoan ? <Typography>Loading...</Typography> : (
                <Box>
                  {/* Loan Profile Card/Grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                      mb: 4,
                      p: 2,
                      bgcolor: '#f7fbff',
                      borderRadius: 2,
                      boxShadow: 1
                    }}
                  >
                    <ProfileField label="Loan ID" value={profileLoan.loan_id} />
                    <ProfileField label="Loan Number" value={profileLoan.loan_number} />
                    <ProfileField label="Member Name" value={profileLoan.member?.member_name} />
                    <ProfileField label="Membership Number" value={profileLoan.member?.membership_number} />
                    <ProfileField label="Contact Number" value={profileLoan.member?.contact_number} />
                    <ProfileField label="Email" value={profileLoan.member?.email} />
                    <ProfileField label="Address" value={profileLoan.member?.address} />
                    <ProfileField label="Society" value={profileLoan.member?.Society?.society_name || profileLoan.society?.society_name} />
                    <ProfileField label="Loan Officer" value={profileLoan.officer?.officer_name || profileLoan.loan_officer?.officer_name} />
                    <ProfileField label="Product Name" value={profileLoan.product?.product_name || profileLoan.loan_product?.product_name} />
                    <ProfileField label="Loan Amount" value={profileLoan.loan_amount} />
                    <ProfileField label="Interest Rate (%)" value={profileLoan.interest_rate} />
                    <ProfileField label="Tenure (Months)" value={profileLoan.tenure_months} />
                    <ProfileField label="Processing Fee" value={profileLoan.processing_fee} />
                    <ProfileField label="Monthly Savings" value={profileLoan.monthly_savings} />
                    <ProfileField label="Total Interest" value={profileLoan.total_interest} />
                    <ProfileField label="Total Payable" value={profileLoan.total_payable} />
                    <ProfileField label="Outstanding Principal" value={profileLoan.outstanding_principal} />
                    <ProfileField label="Outstanding Interest" value={profileLoan.outstanding_interest} />
                    <ProfileField label="Loan Status" value={profileLoan.loan_status} />
                    <ProfileField label="Disbursement Date" value={profileLoan.disbursement_date?.slice(0,10)} />
                    <ProfileField label="First Due Date" value={profileLoan.first_due_date?.slice(0,10)} />
                    <ProfileField label="Last Due Date" value={profileLoan.last_due_date?.slice(0,10)} />
                    <ProfileField label="Created At" value={profileLoan.created_at?.slice(0,10)} />
                  </Box>
                  <Typography sx={{ mt: 2, fontWeight: 700 }}>Repayment Schedule</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.light' }}>
                        <TableCell>S.No.</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>O/B</TableCell>
                        <TableCell>Monthly Interest</TableCell>
                        <TableCell>Monthly Principal</TableCell>
                        <TableCell>C/B</TableCell>
                        <TableCell>Monthly Saving</TableCell>
                        <TableCell>Monthly Total Payment</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Paid</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(profileLoan.RepaymentSchedules || []).map((sch, idx, arr) => (
                        <TableRow key={sch.schedule_id}>
                          <TableCell>{sch.installment_number}</TableCell>
                          <TableCell>{sch.due_date?.slice(0,10)}</TableCell>
                          <TableCell>{sch.opening_balance}</TableCell>
                          <TableCell>{sch.interest_amount}</TableCell>
                          <TableCell>{sch.principal_amount}</TableCell>
                          <TableCell>{sch.closing_balance}</TableCell>
                          <TableCell>{sch.monthly_savings}</TableCell>
                          <TableCell>{sch.total_installment}</TableCell>
                          <TableCell>{sch.payment_status}</TableCell>
                          <TableCell>{sch.paid_amount}</TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow sx={{ bgcolor: 'accent.main', fontWeight: 700 }}>
                        <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total</TableCell>
                        <TableCell>{(profileLoan.RepaymentSchedules || []).reduce((sum, s) => sum + parseFloat(s.interest_amount || 0), 0)}</TableCell>
                        <TableCell>{(profileLoan.RepaymentSchedules || []).reduce((sum, s) => sum + parseFloat(s.principal_amount || 0), 0)}</TableCell>
                        <TableCell></TableCell>
                        <TableCell>{(profileLoan.RepaymentSchedules || []).reduce((sum, s) => sum + parseFloat(s.monthly_savings || 0), 0)}</TableCell>
                        <TableCell>{(profileLoan.RepaymentSchedules || []).reduce((sum, s) => sum + parseFloat(s.total_installment || 0), 0)}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Typography sx={{ mt: 2, fontWeight: 700 }}>Payments</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Principal</TableCell>
                        <TableCell>Interest</TableCell>
                        <TableCell>Savings</TableCell>
                        <TableCell>Penalty</TableCell>
                        <TableCell>Method</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(profileLoan.Payments || []).map(pay => (
                        <TableRow key={pay.payment_id}>
                          <TableCell>{pay.payment_date?.slice(0,10)}</TableCell>
                          <TableCell>{pay.payment_amount}</TableCell>
                          <TableCell>{pay.principal_paid}</TableCell>
                          <TableCell>{pay.interest_paid}</TableCell>
                          <TableCell>{pay.savings_paid}</TableCell>
                          <TableCell>{pay.penalty_paid}</TableCell>
                          <TableCell>{pay.payment_method}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Typography sx={{ mt: 2, fontWeight: 700 }}>Penalties</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(profileLoan.Penalties || []).map(pen => (
                        <TableRow key={pen.penalty_id}>
                          <TableCell>{pen.penalty_date?.slice(0,10)}</TableCell>
                          <TableCell>{pen.penalty_amount}</TableCell>
                          <TableCell>{pen.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Typography sx={{ mt: 2, fontWeight: 700 }}>Savings</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(profileLoan.MemberSavings || []).map(sav => (
                        <TableRow key={sav.savings_id}>
                          <TableCell>{sav.transaction_date?.slice(0,10)}</TableCell>
                          <TableCell>{sav.transaction_type}</TableCell>
                          <TableCell>{sav.amount}</TableCell>
                          <TableCell>{sav.balance}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
