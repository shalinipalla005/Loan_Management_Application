import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Paper, Typography, Grid, Box } from '@mui/material';

export default function Dashboard() {
  const [stats, setStats] = useState({ societies: 0, members: 0, loans: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/societies'),
      api.get('/members'),
      api.get('/loans'),
    ]).then(([soc, mem, loan]) => {
      setStats({ societies: soc.data.length, members: mem.data.length, loans: loan.data.length });
    });
  }, []);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4, display: 'flex' }}>
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Paper sx={{ width: '100%', maxWidth: '100%', mx: 0, p: 3, bgcolor: 'background.default', boxShadow: 2 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>Welcome to the Loan Management Dashboard</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', boxShadow: 1 }}>
                <Typography variant="h4" sx={{ color: 'primary.main' }}>{stats.societies}</Typography>
                <Typography variant="h6">Societies</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'secondary.light', boxShadow: 1 }}>
                <Typography variant="h4" sx={{ color: 'secondary.main' }}>{stats.members}</Typography>
                <Typography variant="h6">Members</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'accent.light', boxShadow: 1 }}>
                <Typography variant="h4" sx={{ color: 'accent.main' }}>{stats.loans}</Typography>
                <Typography variant="h6">Loans</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
} 