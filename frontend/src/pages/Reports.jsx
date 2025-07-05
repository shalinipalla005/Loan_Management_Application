import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Tabs, Tab, Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

function DataTable({ columns, rows }) {
  return (
    <div className="reports-table-container">
      <Table className="reports-table" size="small" sx={{ minWidth: 900, tableLayout: 'auto', width: '100%' }}>
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={col} component="th" sx={{ minWidth: 120, whiteSpace: 'nowrap', fontSize: '1rem', padding: '12px 10px' }}>
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map(col => {
                const value = String(row[col] ?? '');
                return (
                  <TableCell
                    key={col}
                    className={value.length > 20 ? 'ellipsis-cell' : ''}
                    data-fulltext={value.length > 20 ? value : undefined}
                    sx={{ minWidth: 120, whiteSpace: 'nowrap', fontSize: '0.97rem', padding: '10px 8px' }}
                  >
                    {value.length > 20 ? value.slice(0, 18) + '\u2026' : value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
    <Box
      sx={{
        display: 'flex',
        bgcolor: 'background.default',
        minHeight: '100vh',
        height: '100vh',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          width: '100%',
          height: '100vh',
          overflow: 'auto'
        }}
      >
        <Paper
          sx={{
            width: '100%',
            maxWidth: '100vw',
            mx: 0,
            p: { xs: 1, sm: 3 },
            bgcolor: 'background.default',
            boxShadow: 2,
            minHeight: '100vh',
            height: '100%',
            overflow: 'auto'
          }}
        >
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
            Reports
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            className="reports-tabs"
            sx={{ bgcolor: 'primary.light', borderRadius: 2, mb: 3 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Loan Summary" />
            <Tab label="Overdue Loans" />
            <Tab label="Monthly Collections" />
          </Tabs>
          <Box mt={2} sx={{ width: '100%', overflowX: 'auto' }}>
            {tab === 0 && (
              <DataTable columns={loanSummary[0] ? Object.keys(loanSummary[0]) : []} rows={loanSummary} />
            )}
            {tab === 1 && (
              <DataTable columns={overdueLoans[0] ? Object.keys(overdueLoans[0]) : []} rows={overdueLoans} />
            )}
            {tab === 2 && (
              <DataTable columns={monthlyCollections[0] ? Object.keys(monthlyCollections[0]) : []} rows={monthlyCollections} />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}