import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Box, Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

export default function PaymentSchedules() {
  const [schedules, setSchedules] = useState([]);
  useEffect(() => {
    api.get('/repayment-schedules').then(res => setSchedules(res.data));
  }, []);

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Paper sx={{ width: '100%', maxWidth: '100%', mx: 0, p: 3, bgcolor: 'background.default', boxShadow: 2 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>Payment Schedules & Dues</Typography>
          <TableContainer sx={{ width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell>Loan Number</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Installment Amount</TableCell>
                  <TableCell>Paid Amount</TableCell>
                  <TableCell>Due Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.map(sch => (
                  <TableRow key={sch.schedule_id}>
                    <TableCell>{sch.loan_number}</TableCell>
                    <TableCell>{sch.member_name}</TableCell>
                    <TableCell>{sch.due_date?.slice(0,10)}</TableCell>
                    <TableCell>{sch.total_installment}</TableCell>
                    <TableCell>{sch.paid_amount}</TableCell>
                    <TableCell>{sch.total_installment - (sch.paid_amount || 0)}</TableCell>
                    <TableCell>{sch.payment_status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
} 