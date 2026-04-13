import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid2 as Grid,
  Chip,
  Button,
  Avatar,
  IconButton,
  Tooltip as MuiTooltip
} from '@mui/material';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { 
  subscribeToUsers, 
  subscribeToVendors, 
  subscribeToBookings, 
  subscribeToTransactions, 
  formatCurrency, 
  formatTimestamp 
} from '../services/firestoreService';

const COMMISSION_RATE = 0.15;
const MotionCard = motion(Card);

const StatCard = ({ title, value, icon, gradient, delay }) => (
  <MotionCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 3,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: gradient }} />
  </MotionCard>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const unsubs = [
      subscribeToUsers(setUsers),
      subscribeToVendors(setVendors),
      subscribeToBookings(setBookings),
      subscribeToTransactions(setTransactions),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayBookings = bookings.filter((b) => {
    const d = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return d >= today;
  });

  const dueVendors = vendors.filter(v => {
    const dueDate = v.payoutDueDate?.toDate ? v.payoutDueDate.toDate() : (v.payoutDueDate ? new Date(v.payoutDueDate) : null);
    return v.walletBalance > 0 && dueDate && dueDate <= new Date();
  });

  const pendingVendors = vendors.filter((v) => v.status === 'pending');
  // Total Platform Revenue (15% Commission)
  const totalSystemRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => {
    return sum + (Number(b.totalAmount || b.amount) * COMMISSION_RATE);
  }, 0);
  
  // Total Business Volume
  const totalVolume = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (Number(b.totalAmount || b.amount) || 0), 0);

  const enrichedRecentBookings = bookings.slice(0, 5).map(b => {
    const vendor = vendors.find(v => v.id === b.vendorId);
    const customer = users.find(u => u.id === b.customerId || u.id === b.userId);
    return {
      ...b,
      vendorName: b.vendorName || vendor?.businessName || vendor?.name || '—',
      customerName: b.customerName || customer?.name || '—',
    };
  });

  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayBookings = bookings.filter((b) => {
      const bd = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return bd.toDateString() === d.toDateString() && b.status === 'completed';
    });
    return {
      name: d.toLocaleDateString('en', { weekday: 'short' }),
      revenue: dayBookings.reduce((s, b) => s + (Number(b.commission) || (Number(b.totalAmount || b.amount) * COMMISSION_RATE)), 0),
      bookings: dayBookings.length,
    };
  });

  const customersCount = users.filter(u => u.role === 'customer' || !u.role).length;

  const stats = [
    { title: 'TOTAL CUSTOMERS', value: customersCount, icon: <PeopleRoundedIcon />, gradient: 'linear-gradient(135deg, #7C5CFC 0%, #9F85FD 100%)' },
    { title: 'TOTAL VENDORS', value: vendors.length, icon: <StorefrontRoundedIcon />, gradient: 'linear-gradient(135deg, #00D9A6 0%, #33E1B8 100%)' },
    { title: 'SYSTEM REVENUE', value: formatCurrency(totalSystemRevenue), icon: <AttachMoneyRoundedIcon />, gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
    { title: 'TOTAL VOLUME', value: formatCurrency(totalVolume), icon: <TrendingUpRoundedIcon />, gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
    { title: 'TOTAL BOOKINGS', value: bookings.length, icon: <EventNoteRoundedIcon />, gradient: 'linear-gradient(135deg, #38BDF8 0%, #7DD3FC 100%)' },
    { title: 'TODAY BOOKINGS', value: todayBookings.length, icon: <TodayRoundedIcon />, gradient: 'linear-gradient(135deg, #FFB547 0%, #FFCF7D 100%)' },
  ];

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Dashboard Overview</Typography>
          <Chip icon={<TrendingUpRoundedIcon sx={{ fontSize: '0.9rem !important' }} />} label="Live" size="small" color="success" sx={{ fontWeight: 700, px: 0.5, height: 24, borderRadius: 1.5 }} />
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {stats.map((stat, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={stat.title}>
            <StatCard {...stat} delay={i * 0.08} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontSize: '1rem', fontWeight: 700 }}>Total Volume Trend</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94A3B8" fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: 12, color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#7C5CFC" strokeWidth={3} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Vendors Due for Payout */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>Pending Settlements</Typography>
                <Chip label={dueVendors.length} size="small" color="primary" sx={{ fontWeight: 800, height: 22 }} />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dueVendors.slice(0, 4).map((v) => (
                  <Box key={v.id} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate(`/vendors/${v.id}`)}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>{v.name[0]}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{v.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Wallet: <span style={{ color: '#00D9A6', fontWeight: 700 }}>{formatCurrency(v.walletBalance)}</span></Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={() => navigate('/settlements')} sx={{ color: 'primary.main' }}>
                      <PaymentRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                
                {dueVendors.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CheckCircleRoundedIcon sx={{ color: 'success.main', fontSize: '2rem', mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">All payouts are up to date</Typography>
                  </Box>
                )}
                
                <Button fullWidth endIcon={<ChevronRightRoundedIcon />} onClick={() => navigate('/settlements')} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
                  Process Payouts
                </Button>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Recent Activity Table */}
        <Grid size={{ xs: 12 }}>
          <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontSize: '1rem', fontWeight: 700 }}>Recent Booking Activity</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', '& th': { textAlign: 'left', p: 1.5, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }, '& td': { p: 1.5, fontSize: '0.85rem' }, '& tbody tr': { transition: 'all 0.2s ease', '&:hover': { bgcolor: 'action.hover' } } }}>
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer</th>
                      <th>Vendor</th>
                      <th>Total Amount</th>
                      <th>Paid Online</th>
                      <th>Pay at Store</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedRecentBookings.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{b.id?.slice(0, 8)}</td>
                        <td>{b.customerName}</td>
                        <td style={{ fontWeight: 600, color: 'primary.main' }}>{b.vendorName}</td>
                        <td style={{ fontWeight: 800 }}>{formatCurrency(b.totalAmount || b.amount)}</td>
                        <td style={{ color: '#10B981' }}>{formatCurrency(b.paidOnline || 0)}</td>
                        <td style={{ color: '#F59E0B' }}>{formatCurrency(b.payAtStore || 0)}</td>
                        <td>
                          <Chip label={b.status || 'pending'} size="small" color={b.status === 'completed' ? 'success' : b.status === 'pending' ? 'warning' : b.status === 'cancelled' ? 'error' : 'default'} variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem' }} />
                        </td>
                        <td style={{ color: '#94A3B8' }}>{formatTimestamp(b.createdAt)}</td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No recent activity found</td></tr>
                    )}
                  </tbody>
                </Box>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
