import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import ReportIcon from '@mui/icons-material/Report';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PeopleIcon from '@mui/icons-material/People';
import { Link } from 'react-router-dom';
import GetAppIcon from '@mui/icons-material/GetApp';
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Button } from '@mui/material';


const drawerWidth = 240;

function getOfficerRole() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getOfficerRole();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const menu = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Societies', icon: <AccountBalanceIcon />, path: '/societies' },
    { text: 'Members', icon: <GroupIcon />, path: '/members' },
    { text: 'Loans', icon: <AssignmentIcon />, path: '/loans' },
    { text: 'Products', icon: <MonetizationOnIcon />, path: '/products' },
    { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
    { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
    { 
      text: 'Officers', 
      icon: role === 'admin' ? <SupervisorAccountIcon /> : <PeopleIcon />, 
      path: '/officers' 
    },
    { text: 'Export Loans', icon: <GetAppIcon />, action: 'exportLoans' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleExportLoans = () => {
    setExportDialogOpen(true);
  };

  const handleDownload = async (format) => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = '/api/loans/export';
      let filename = 'all_loans_export.xlsx';
      let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (format === 'pdf') {
        url = '/api/loans/export/pdf';
        filename = 'all_loans_export.pdf';
        contentType = 'application/pdf';
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      // Try to get filename from header
      const disposition = res.headers.get('Content-Disposition');
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      alert('Export failed');
    }
    setExportLoading(false);
    setExportDialogOpen(false);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid #e0e0e0',
          boxShadow: 2,
        },
      }}
    >
      <Toolbar sx={{ minHeight: 64 }} />
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="h6" noWrap color="primary.main" sx={{ fontWeight: 700, mb: 2, letterSpacing: 1 }}>
          Loan App
        </Typography>
        <List>
          {menu.map(item => (
            <ListItem
              component={item.path ? Link : 'button'}
              button
              key={item.text}
              to={item.path}
              selected={item.path && location.pathname === item.path}
              onClick={item.action === 'exportLoans' ? handleExportLoans : undefined}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: item.path && location.pathname === item.path ? 'primary.light' : 'inherit',
                color: item.path && location.pathname === item.path ? 'primary.main' : 'text.primary',
                '&:hover': {
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Box mt={4} textAlign="center">
          <Typography
            variant="body2"
            color="error"
            sx={{ cursor: 'pointer', fontWeight: 500 }}
            onClick={handleLogout}
          >
            Logout
          </Typography>
        </Box>
      </Box>
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Loans</DialogTitle>
        <DialogContent>
          <Typography>Choose the format to export all loans:</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDownload('excel')} disabled={exportLoading}>
            Excel
          </Button>
          {/* <Button onClick={() => handleDownload('pdf')} disabled={exportLoading}>
            PDF
          </Button> */}
          <Button onClick={() => setExportDialogOpen(false)} disabled={exportLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}