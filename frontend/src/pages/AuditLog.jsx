import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Typography, TextField, Button, Paper, Box, MenuItem, TablePagination
} from '@mui/material';

const actions = ['INSERT', 'UPDATE', 'DELETE'];

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ table_name: '', action: '', user_id: '', record_id: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [count, setCount] = useState(0);

  const fetchLogs = async () => {
    const params = { ...filters, limit: rowsPerPage, offset: page * rowsPerPage };
    const { data } = await api.get('/audit-log', { params });
    setLogs(data.logs);
    setCount(data.count);
  };

  useEffect(() => { fetchLogs(); }, [page, rowsPerPage]);

  const handleFilterChange = (e) => {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFilter = () => {
    setPage(0);
    fetchLogs();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper sx={{ p: 3, bgcolor: '#E7EFC7' }}>
      <Typography variant="h4" gutterBottom>Audit Log</Typography>
      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        <TextField label="Table Name" name="table_name" value={filters.table_name} onChange={handleFilterChange} size="small" />
        <TextField label="Action" name="action" value={filters.action} onChange={handleFilterChange} select size="small" style={{ minWidth: 120 }}>
          <MenuItem value="">All</MenuItem>
          {actions.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </TextField>
        <TextField label="User ID" name="user_id" value={filters.user_id} onChange={handleFilterChange} size="small" />
        <TextField label="Record ID" name="record_id" value={filters.record_id} onChange={handleFilterChange} size="small" />
        <Button variant="contained" color="primary" onClick={handleFilter}>Filter</Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Table</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Record</TableCell>
            <TableCell>Timestamp</TableCell>
            <TableCell>Old Values</TableCell>
            <TableCell>New Values</TableCell>
            <TableCell>IP</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.log_id}>
              <TableCell>{log.table_name}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.user_id}</TableCell>
              <TableCell>{log.record_id}</TableCell>
              <TableCell>{log.timestamp}</TableCell>
              <TableCell><pre style={{ whiteSpace: 'pre-wrap', maxWidth: 200, overflow: 'auto' }}>{log.old_values}</pre></TableCell>
              <TableCell><pre style={{ whiteSpace: 'pre-wrap', maxWidth: 200, overflow: 'auto' }}>{log.new_values}</pre></TableCell>
              <TableCell>{log.ip_address}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
} 