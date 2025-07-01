import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, 
  Paper, Box, Alert, Snackbar, TableContainer 
} from '@mui/material';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    interest_rate: '', 
    processing_fee_rate: '', 
    min_amount: '', 
    max_amount: '', 
    min_tenure_months: '', 
    max_tenure_months: '', 
    monthly_savings_required: '', 
    savings_interest_rate: '', 
    penalty_amount: '' 
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/loan-products');
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleOpen = (product = { 
    interest_rate: '', 
    processing_fee_rate: '', 
    min_amount: '', 
    max_amount: '', 
    min_tenure_months: '', 
    max_tenure_months: '', 
    monthly_savings_required: '', 
    savings_interest_rate: '', 
    penalty_amount: '' 
  }) => {
    setForm(product);
    setEditId(product.product_id || null);
    setOpen(true);
    setError('');
  };

  const handleClose = () => { 
    setOpen(false); 
    setForm({ 
      interest_rate: '', 
      processing_fee_rate: '', 
      min_amount: '', 
      max_amount: '', 
      min_tenure_months: '', 
      max_tenure_months: '', 
      monthly_savings_required: '', 
      savings_interest_rate: '', 
      penalty_amount: '' 
    }); 
    setEditId(null); 
    setError(''); 
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editId) {
        await api.put(`/loan-products/${editId}`, form);
        setSuccess('Product updated successfully');
      } else {
        await api.post('/loan-products', form);
        setSuccess('Product created successfully');
      }
      handleClose();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/loan-products/${id}`);
      setSuccess('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Paper sx={{ width: '100%', maxWidth: '100%', mx: 0, p: 3, bgcolor: 'background.default', boxShadow: 2 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>Loan Products</Typography>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button 
              variant="contained" 
              onClick={() => handleOpen()} 
              disabled={loading}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Add Product
            </Button>
          </Box>
          {loading && <Typography>Loading...</Typography>}
          <TableContainer sx={{ width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Interest Rate (%)</TableCell>
                  <TableCell>Processing Fee (%)</TableCell>
                  <TableCell>Min Amount</TableCell>
                  <TableCell>Max Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.product_id}>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.interest_rate}</TableCell>
                    <TableCell>{product.processing_fee_rate}</TableCell>
                    <TableCell>{product.min_amount}</TableCell>
                    <TableCell>{product.max_amount}</TableCell>
                    <TableCell>{product.status}</TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => handleOpen(product)}
                        disabled={loading}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button 
                        color="error" 
                        onClick={() => handleDelete(product.product_id)}
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

          <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogContent>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                <TextField
                  label="Interest Rate (%) *"
                  value={form.interest_rate}
                  onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))}
                  fullWidth required type="number"
                />
                <TextField
                  label="Processing Fee Rate (%)"
                  value={form.processing_fee_rate}
                  onChange={e => setForm(f => ({ ...f, processing_fee_rate: e.target.value }))}
                  fullWidth type="number"
                />
                <TextField
                  label="Min Amount (₹)"
                  value={form.min_amount}
                  onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))}
                  fullWidth type="number"
                />
                <TextField
                  label="Max Amount (₹)"
                  value={form.max_amount}
                  onChange={e => setForm(f => ({ ...f, max_amount: e.target.value }))}
                  fullWidth type="number"
                />
                <TextField
                  label="Min Tenure (Months)"
                  value={form.min_tenure_months}
                  onChange={e => setForm(f => ({ ...f, min_tenure_months: e.target.value }))}
                  fullWidth type="number"
                />
                <TextField
                  label="Max Tenure (Months)"
                  value={form.max_tenure_months}
                  onChange={e => setForm(f => ({ ...f, max_tenure_months: e.target.value }))}
                  fullWidth type="number"
                />
                <TextField
                  label="Monthly Savings Required (₹)"
                  value={form.monthly_savings_required}
                  onChange={e => setForm(f => ({ ...f, monthly_savings_required: e.target.value }))}
                  fullWidth type="number"
                />
                <TextField
                  label="Savings Interest Rate (%)"
                  value={form.savings_interest_rate}
                  onChange={e => setForm(f => ({ ...f, savings_interest_rate: e.target.value }))}
                  fullWidth type="number"
                />
                <TextField
                  label="Penalty Amount (₹)"
                  value={form.penalty_amount}
                  onChange={e => setForm(f => ({ ...f, penalty_amount: e.target.value }))}
                  fullWidth type="number"
                />
              </Box>
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained" 
                disabled={loading || !form.interest_rate}
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