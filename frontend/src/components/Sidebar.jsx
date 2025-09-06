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
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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
         
        </Typography>
        <List>
          {menu.map(item => (
            <ListItem
              component={item.path ? Link : 'button'}
              button
              key={item.text}
              to={item.path}
              selected={item.path && location.pathname === item.path}
              onClick={undefined}
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
    </Drawer>
  );
}