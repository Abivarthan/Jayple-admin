import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid2 as Grid,
  Chip,
} from '@mui/material';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { subscribeToUsers, subscribeToVendors, subscribeToBookings, subscribeToTransactions } from '../services/firestoreService';

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
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontSize: '0.7rem' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 3,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: `0 4px 12px ${gradient.includes('#7C5CFC') ? 'rgba(124,92,252,0.3)' : gradient.includes('#00D9A6') ? 'rgba(0,217,166,0.3)' : gradient.includes('#FFB547') ? 'rgba(255,181,71,0.3)' : 'rgba(56,189,248,0.3)'}`,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: gradient,
      }}
    />
  </MotionCard>
);

const Dashboard = () => {
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

  const pendingVendors = vendors.filter((v) => v.status === 'pending');
  const failedBookings = bookings.filter((b) => b.status === 'failed' || b.status === 'cancelled');
  const totalEarnings = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const enrichedRecentBookings = bookings.slice(0, 8).map(b => {
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
      return bd.toDateString() === d.toDateString();
    });
    return {
      name: d.toLocaleDateString('en', { weekday: 'short' }),
      revenue: dayBookings.reduce((s, b) => s + (b.amount || 0), 0),
      bookings: dayBookings.length,
    };
  });

  const stats = [
    { title: 'TOTAL USERS', value: users.length, icon: <PeopleRoundedIcon />, gradient: 'linear-gradient(135deg, #7C5CFC 0%, #9F85FD 100%)' },
    { title: 'TOTAL VENDORS', value: vendors.length, icon: <StorefrontRoundedIcon />, gradient: 'linear-gradient(135deg, #00D9A6 0%, #33E1B8 100%)' },
    { title: 'TOTAL BOOKINGS', value: bookings.length, icon: <EventNoteRoundedIcon />, gradient: 'linear-gradient(135deg, #38BDF8 0%, #7DD3FC 100%)' },
    { title: 'TODAY BOOKINGS', value: todayBookings.length, icon: <TodayRoundedIcon />, gradient: 'linear-gradient(135deg, #FFB547 0%, #FFCF7D 100%)' },
    { title: 'PENDING VENDORS', value: pendingVendors.length, icon: <HourglassBottomRoundedIcon />, gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
    { title: 'TOTAL EARNINGS', value: `₹${totalEarnings.toLocaleString()}`, icon: <AttachMoneyRoundedIcon />, gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
    { title: 'FAILED BOOKINGS', value: failedBookings.length, icon: <ErrorOutlineRoundedIcon />, gradient: 'linear-gradient(135deg, #FF5C6C 0%, #FF8A94 100%)' },
  ];

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Dashboard</Typography>
          <Chip icon={<TrendingUpRoundedIcon sx={{ fontSize: '0.9rem !important' }} />} label="Live" size="small" color="success" sx={{ fontWeight: 600, height: 24 }} />
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {stats.map((stat, i) => (
          <Grid xs={12} sm={6} md={4} lg={3} key={stat.title}>
            <StatCard {...stat} delay={i * 0.08} />
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5}>
        <Grid xs={12} md={8}>
          <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontSize: '1rem' }}>Revenue Trend</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, color: '#F1F5F9' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#7C5CFC" strokeWidth={2.5} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid xs={12} md={4}>
          <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontSize: '1rem' }}>Bookings (7 Days)</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, color: '#F1F5F9' }} />
                  <Bar dataKey="bookings" fill="#00D9A6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Recent Bookings */}
      <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }} sx={{ mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>Recent Bookings</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', '& th': { textAlign: 'left', p: 1.5, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }, '& td': { p: 1.5, fontSize: '0.85rem' }, '& tbody tr': { transition: 'all 0.2s ease', '&:hover': { bgcolor: 'action.hover' } } }}>
              <thead>
                <tr><th>Booking ID</th><th>Customer</th><th>Vendor</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {enrichedRecentBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{b.id?.slice(0, 8)}</td>
                    <td>{b.customerName}</td>
                    <td>{b.vendorName}</td>
                    <td style={{ fontWeight: 600 }}>₹{b.amount || 0}</td>
                    <td>
                      <Chip label={b.status || 'pending'} size="small" color={b.status === 'completed' ? 'success' : b.status === 'pending' ? 'warning' : b.status === 'cancelled' ? 'error' : 'default'} variant="outlined" />
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No bookings yet</td></tr>
                )}
              </tbody>
            </Box>
          </Box>
        </CardContent>
      </MotionCard>
    </Box>
  );
};

export default Dashboard;
