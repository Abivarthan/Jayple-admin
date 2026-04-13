import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

const DRAWER_WIDTH = 272;

const navItems = [
  { label: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/' },
  { label: 'Vendors', icon: <StorefrontRoundedIcon />, path: '/vendors' },
  { label: 'Customers', icon: <PeopleRoundedIcon />, path: '/customers' },
  { label: 'Bookings', icon: <EventNoteRoundedIcon />, path: '/bookings' },
  { label: 'Settlements', icon: <AccountBalanceWalletRoundedIcon />, path: '/settlements' },
  { label: 'Platform Earnings', icon: <TrendingUpRoundedIcon />, path: '/earnings' },
  { label: 'Disputes', icon: <GavelRoundedIcon />, path: '/disputes' },
];

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        pt: 3,
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 4 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #7C5CFC 0%, #00D9A6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 800,
            color: '#fff',
          }}
        >
          J
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', lineHeight: 1.2, fontWeight: 800 }}>
            Jayple
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Admin Console
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ px: 1.5, mb: 1, color: 'text.secondary', fontSize: '0.65rem' }}>
          MAIN MENU
        </Typography>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Box
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.3,
                mb: 0.5,
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                color: isActive ? '#fff' : 'text.secondary',
                ...(isActive && {
                  background: 'linear-gradient(135deg, #7C5CFC 0%, #6C3FE8 100%)',
                  boxShadow: '0 4px 15px rgba(124, 92, 252, 0.35)',
                }),
                '&:hover': {
                  ...(!isActive && {
                    bgcolor: mode === 'dark' ? 'rgba(124, 92, 252, 0.08)' : 'rgba(108, 63, 232, 0.06)',
                    color: 'text.primary',
                  }),
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.2rem',
                },
              }}
            >
              {item.icon}
              <Typography sx={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Logout */}
      <Box
        onClick={handleLogout}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.3,
          borderRadius: 3,
          cursor: 'pointer',
          color: 'text.secondary',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'rgba(239, 68, 68, 0.08)',
            color: '#EF4444',
          },
        }}
      >
        <LogoutRoundedIcon sx={{ fontSize: '1.2rem' }} />
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Logout</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar – Desktop */}
      {!isMobile && (
        <Box
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {drawerContent}
        </Box>
      )}

      {/* Sidebar – Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: 'background.paper',
            borderRight: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: mode === 'dark' ? 'rgba(10, 14, 26, 0.8)' : 'rgba(244, 246, 251, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} size="small">
                <MenuRoundedIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                {navItems.find((n) => n.path === location.pathname)?.label || 'Dashboard'}
              </Typography>
            </Box>
            <Tooltip title="Toggle theme">
              <IconButton onClick={toggleTheme} size="small">
                {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton size="small">
                <Badge badgeContent={3} color="error" variant="dot">
                  <NotificationsNoneRoundedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: '0.85rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7C5CFC 0%, #00D9A6 100%)',
                ml: 0.5,
              }}
            >
              {currentUser?.email?.[0]?.toUpperCase() || 'A'}
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3.5 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
