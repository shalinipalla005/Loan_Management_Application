import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Tabs, Tab, Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

function DataTable({ columns, rows }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          {columns.map(col => <TableCell key={col}>{col}</TableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {columns.map(col => <TableCell key={col}>{row[col]}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [loanSummary, setLoanSummary] = useState([]);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [monthlyCollections, setMonthlyCollections] = useState([]);

  useEffect(() => {
    api.get('/reports/loan-summary').then(res => setLoanSummary(res.data));
    api.get('/reports/overdue-loans').then(res => setOverdueLoans(res.data));
    api.get('/reports/monthly-collections').then(res => setMonthlyCollections(res.data));
  }, []);

  return (
    <Paper style={{ padding: 24 }}>
      <Typography variant="h4" gutterBottom>Reports</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Loan Summary" />
        <Tab label="Overdue Loans" />
        <Tab label="Monthly Collections" />
      </Tabs>
      <Box mt={2}>
        {tab === 0 && <DataTable columns={loanSummary[0] ? Object.keys(loanSummary[0]) : []} rows={loanSummary} />}
        {tab === 1 && <DataTable columns={overdueLoans[0] ? Object.keys(overdueLoans[0]) : []} rows={overdueLoans} />}
        {tab === 2 && <DataTable columns={monthlyCollections[0] ? Object.keys(monthlyCollections[0]) : []} rows={monthlyCollections} />}
      </Box>
    </Paper>
  );
} 