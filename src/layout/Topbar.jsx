import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, IconButton, Typography, Box, Avatar, Tooltip, Badge, useTheme, 
  Menu, MenuItem, ListItemText, ListItemIcon, Divider, Button, Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markNotificationAsRead, checkVendorPayoutDue, formatTimestamp } from '../services/firestoreService';

const Topbar = ({ onMenuClick }) => {
  const { mode, toggleMode } = useAppTheme();
  const { currentUser } = useAuth();
  const theme = useTheme();
  
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    // 1. Subscribe to notifications
    const unsub = subscribeToNotifications(setNotifications);
    
    // 2. Trigger a check for payout dues (simulates the daily scheduled function)
    checkVendorPayoutDue();

    return () => unsub && unsub();
  }, []);

  const handleOpenNotifs = (event) => setAnchorEl(event.currentTarget);
  const handleCloseNotifs = () => setAnchorEl(null);

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(id);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'payout_due': return <ScheduleRoundedIcon sx={{ color: '#FFB547' }} />;
      case 'payout_completed': return <CheckCircleRoundedIcon sx={{ color: '#00D9A6' }} />;
      default: return <ErrorOutlineRoundedIcon sx={{ color: 'primary.main' }} />;
    }
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton 
              onClick={toggleMode} 
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': { color: 'primary.main', bgcolor: 'action.hover' }
              }}
            >
              {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          <IconButton 
            onClick={handleOpenNotifs}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { color: 'primary.main', bgcolor: 'action.hover' }
            }}
          >
            <Badge badgeContent={unreadCount} color="error" overlap="circular">
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>

          {/* Notifications Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseNotifs}
            PaperProps={{
              sx: { width: 320, mt: 1.5, borderRadius: 3, boxShadow: theme.shadows[10], maxHeight: 480 }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
              {unreadCount > 0 && <Chip label={`${unreadCount} New`} size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />}
            </Box>
            <Divider />
            
            {notifications.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
              </Box>
            ) : (
              notifications.map((n) => (
                <MenuItem 
                  key={n.id} 
                  onClick={() => handleMarkAsRead(n.id)}
                  sx={{ 
                    py: 1.5, 
                    px: 2, 
                    whiteSpace: 'normal',
                    bgcolor: n.isRead ? 'transparent' : 'action.hover',
                    borderLeft: n.isRead ? 'none' : '4px solid ' + theme.palette.primary.main
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{getNotifIcon(n.type)}</ListItemIcon>
                  <ListItemText 
                    primary={n.title}
                    secondary={
                      <>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: n.isRead ? 400 : 700, color: 'text.primary' }}>
                          {n.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{formatTimestamp(n.createdAt)}</Typography>
                      </>
                    }
                  />
                </MenuItem>
              ))
            )}
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button fullWidth size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>See all notifications</Button>
            </Box>
          </Menu>

          <Box 
            sx={{ 
              ml: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              pl: 2,
              borderLeft: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight="700" color="text.primary">
                {currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Admin')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5 }}>
                Administrator
              </Typography>
            </Box>
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: 'primary.main', 
                fontSize: '0.85rem', 
                fontWeight: 700,
                boxShadow: '0 0 0 2px ' + (mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
              }}
            >
              {currentUser?.email?.[0]?.toUpperCase() || 'A'}
            </Avatar>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
