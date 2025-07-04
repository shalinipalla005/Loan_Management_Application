import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Tabs, Tab, Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

function DataTable({ columns, rows }) {
  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 400, tableLayout: 'fixed', width: '100%' }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.light' }}>
            {columns.map(col => (
              <TableCell
                key={col}
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                  padding: { xs: '4px 6px', sm: '6px 10px' },
                  maxWidth: 100,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map(col => (
                <TableCell
                  key={col}
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.85rem' },
                    padding: { xs: '4px 6px', sm: '6px 10px' },
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal'
                  }}
                >
                  {String(row[col]).length > 20
                    ? <span title={row[col]}>{String(row[col]).slice(0, 18)}…</span>
                    : row[col]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
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
            sx={{ bgcolor: 'primary.light', borderRadius: 2 }}
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