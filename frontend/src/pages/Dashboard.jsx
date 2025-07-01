import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Paper, Typography, Grid } from '@mui/material';

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
    <Paper style={{ padding: 32 }}>
      <Typography variant="h4" gutterBottom>Welcome to the Loan Management Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#AEC8A4' }}>
            <Typography variant="h4">{stats.societies}</Typography>
            <Typography variant="h6">Societies</Typography>
          </Paper>
        </Grid>
        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#8A784E' }}>
            <Typography variant="h4">{stats.members}</Typography>
            <Typography variant="h6">Members</Typography>
          </Paper>
        </Grid>
        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#3B3B1A' }}>
            <Typography variant="h4">{stats.loans}</Typography>
            <Typography variant="h6">Loans</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
} 