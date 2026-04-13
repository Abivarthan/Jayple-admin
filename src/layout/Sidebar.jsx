import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Divider, useTheme, useMediaQuery } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VendorsIcon from '@mui/icons-material/Storefront';
import CustomersIcon from '@mui/icons-material/People';
import BookingsIcon from '@mui/icons-material/EventNote';
import PaymentsIcon from '@mui/icons-material/Payments';
import DisputesIcon from '@mui/icons-material/ReportProblem';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ open, onClose, variant = "permanent" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { logout } = useAuth();
  const drawerWidth = 260;

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Vendors', icon: <VendorsIcon />, path: '/vendors' },
    { text: 'Customers', icon: <CustomersIcon />, path: '/customers' },
    { text: 'Bookings', icon: <BookingsIcon />, path: '/bookings' },
    { text: 'Settlements', icon: <PaymentsIcon />, path: '/settlements' },
    { text: 'Disputes', icon: <DisputesIcon />, path: '/disputes' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box 
          sx={{ 
            width: 35, 
            height: 35, 
            bgcolor: 'primary.main', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}
        >
          J
        </Box>
        <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: -0.5 }}>
          Jayple Admin
        </Typography>
      </Box>

      <Box sx={{ px: 2, flexGrow: 1 }}>
        <List sx={{ mt: 1 }}>
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton 
                  selected={active}
                  onClick={() => {
                    navigate(item.path);
                    if (onClose) onClose();
                  }}
                  sx={{
                    borderRadius: '10px',
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': { color: 'white' },
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                    '&:hover:not(.Mui-selected)': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: active ? 'inherit' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      fontWeight: active ? 600 : 500 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2, opacity: 0.1 }} />
        <ListItemButton 
          onClick={handleLogout}
          sx={{ 
            borderRadius: '10px', 
            color: theme.palette.error.main,
            '&:hover': { bgcolor: 'error.lighter' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          boxShadow: 'none'
        },
      }}
    >
      {content}
    </Drawer>
  );
};

export default Sidebar;
