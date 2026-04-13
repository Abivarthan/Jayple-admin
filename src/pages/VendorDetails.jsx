import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Chip, Avatar,
  IconButton, TablePagination, Button, Divider, Skeleton, TextField, InputAdornment, Stack,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { motion } from 'framer-motion';
import {
  subscribeToVendorById,
  subscribeToVendorBookings,
  subscribeToVendorTransactions,
  subscribeToVendorSettlements,
  deleteVendor,
  formatTimestamp,
  formatCurrency,
  formatLocation,
} from '../services/firestoreService';
import DeleteVendorModal from '../components/DeleteVendorModal';

const MotionCard = motion(Card);
const COMMISSION_RATE = 0.15;

const statusConfig = {
  approved: { color: 'success', label: 'Approved' },
  pending: { color: 'warning', label: 'Pending' },
  suspended: { color: 'error', label: 'Suspended' },
  rejected: { color: 'error', label: 'Rejected' },
  completed: { color: 'success', label: 'Completed' },
  cancelled: { color: 'error', label: 'Cancelled' },
  failed: { color: 'error', label: 'Failed' },
  ongoing: { color: 'info', label: 'Ongoing' },
};

const paymentConfig = {
  cash: { color: '#FFB547', label: 'Cash' },
  online: { color: '#00D9A6', label: 'Online' },
};

const VendorDetails = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txnPage, setTxnPage] = useState(0);
  const [txnRows, setTxnRows] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingPage, setBookingPage] = useState(0);
  const [bookingRows, setBookingRows] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const unsubs = [
      subscribeToVendorById(vendorId, (v) => { setVendor(v); setLoading(false); }),
      subscribeToVendorBookings(vendorId, setBookings),
      subscribeToVendorTransactions(vendorId, setTransactions),
      subscribeToVendorSettlements(vendorId, setSettlements),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [vendorId]);

  const handleDeleteConfirm = async () => {
    await deleteVendor(vendorId);
    navigate('/vendors');
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3, borderRadius: 3 }} />
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 5 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 5 }} />
      </Box>
    );
  }

  if (!vendor) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6" color="text.secondary">Vendor not found</Typography>
        <Button onClick={() => navigate('/vendors')} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const totalEarnings = vendor.totalEarnings || completedBookings.reduce((s, b) => s + (Number(b.totalAmount || b.amount) || 0), 0);
  const walletBalance = vendor.walletBalance || 0;
  const vendorDue = vendor.vendorDue || 0;

  // Filtered Bookings for Earnings List
  const filteredBookings = bookings.filter((b) => {
    const matchSearch = (b.customerName || '').toLowerCase().includes(bookingSearch.toLowerCase()) || 
                       (b.phone || '').includes(bookingSearch) || 
                       (b.id || '').includes(bookingSearch);
    const matchPayment = paymentFilter === 'all' || (b.paymentMethod || 'cash').toLowerCase() === paymentFilter;
    
    let matchDate = true;
    if (startDate || endDate) {
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59);
      matchDate = bDate >= start && bDate <= end;
    }

    return matchSearch && matchPayment && matchDate;
  });

  const pagedBookings = filteredBookings.slice(bookingPage * bookingRows, bookingPage * bookingRows + bookingRows);

  // Filtered transactions
  const filteredTxns = transactions.filter((t) =>
    statusFilter === 'all' || t.status === statusFilter
  );
  const pagedTxns = filteredTxns.slice(txnPage * txnRows, txnPage * txnRows + txnRows);

  const exportCustomerListCSV = () => {
    const headers = ['Customer Name', 'Booking ID', 'Service', 'Total Amount', 'Commission', 'Vendor Earnings', 'Payment Type', 'Date'];
    const rows = filteredBookings.map((b) => {
      const comm = b.commission || (Number(b.totalAmount || b.amount) * COMMISSION_RATE);
      const earn = b.vendorEarning || (Number(b.totalAmount || b.amount) - comm);
      return [
        b.customerName || '—', b.id || '', b.serviceName || b.service || '—',
        b.totalAmount || b.amount || 0, comm.toFixed(2), earn.toFixed(2),
        b.paymentMethod || 'Cash', formatTimestamp(b.createdAt),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor_${vendorId}_earnings.csv`;
    a.click();
  };

  const exportTransactionsCSV = () => {
    const headers = ['Booking ID', 'Customer', 'Service', 'Amount', 'Commission', 'Vendor Earnings', 'Status', 'Date'];
    const rows = filteredTxns.map((t) => [
      t.bookingId || t.id || '', t.customerName || '', t.service || '',
      t.amount || 0, ((t.amount || 0) * COMMISSION_RATE).toFixed(2),
      ((t.amount || 0) * (1 - COMMISSION_RATE)).toFixed(2),
      t.status || '', formatTimestamp(t.createdAt),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor_${vendorId}_transactions.csv`;
    a.click();
  };

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5 }}>
          <IconButton onClick={() => navigate('/vendors')} sx={{ bgcolor: 'action.hover', borderRadius: 3 }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Avatar sx={{ width: 48, height: 48, fontWeights: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #7C5CFC 0%, #00D9A6 100%)' }}>
            {(vendor.name || '?')[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{vendor.name}</Typography>
              <Chip label={statusConfig[vendor.status]?.label || vendor.status} color={statusConfig[vendor.status]?.color || 'default'} size="small" />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>ID: {vendorId}</Typography>
          </Box>
          <IconButton onClick={() => setIsDeleteModalOpen(true)} sx={{ bgcolor: 'error.lighter', color: 'error.main', borderRadius: 3, '&:hover': { bgcolor: 'error.light' } }}>
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </Box>
      </motion.div>

      {/* Vendor Info Card */}
      <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontSize: '0.65rem', mb: 3, letterSpacing: '0.1em', fontWeight: 700 }}>VENDOR INFORMATION</Typography>
          
          <Grid container spacing={4}>
            {/* Left Side */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>OWNER NAME</Typography>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>{vendor.name}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>SHOP NAME</Typography>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'primary.main' }}>
                    {vendor.storeName}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>EMAIL ID</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{vendor.email}</Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Right Side */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>PHONE NUMBER</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    {vendor.phone}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>LOCATION (CITY / ADDRESS)</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {formatLocation(vendor.city || vendor.location)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>JOINED DATE</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {formatTimestamp(vendor.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </MotionCard>

      {/* Financial Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'WALLET (PLATFORM OWES)', value: formatCurrency(walletBalance), icon: <AccountBalanceWalletRoundedIcon />, gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
          { label: 'DUE (VENDOR OWES)', value: formatCurrency(vendorDue), icon: <TrendingUpRoundedIcon />, gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
          { label: 'TOTAL EARNINGS', value: formatCurrency(totalEarnings), icon: <CheckCircleRoundedIcon />, gradient: 'linear-gradient(135deg, #7C5CFC 0%, #9F85FD 100%)' },
          { label: 'TOTAL ORDERS', value: bookings.length, icon: <ScheduleRoundedIcon />, gradient: 'linear-gradient(135deg, #38BDF8 0%, #7DD3FC 100%)' },
        ].map((card, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
            <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} sx={{ position: 'relative', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontSize: '0.65rem' }}>{card.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{card.value}</Typography>
                  </Box>
                  <Box sx={{ width: 46, height: 38, borderRadius: 2, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
              <Box sx={{ height: 3, background: card.gradient }} />
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Vendor Earnings Table Section */}
      <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Vendor Earnings List</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField size="small" placeholder="Search earnings..." value={bookingSearch} 
                onChange={(e) => { setBookingSearch(e.target.value); setBookingPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} /></InputAdornment> }}
                sx={{ width: 220 }}
              />
              <Button size="small" variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={exportCustomerListCSV} sx={{ borderRadius: 2, textTransform: 'none' }}>Export Earnings</Button>
            </Box>
          </Box>

          {/* Date Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <TextField label="From" type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <TextField label="To" type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            {(startDate || endDate) && <Button size="small" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear</Button>}
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px',
              '& th': { textAlign: 'left', p: 1.5, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' },
              '& td': { p: 1.5, fontSize: '0.85rem' },
              '& tbody tr': { transition: 'all 0.15s ease', '&:hover': { bgcolor: 'action.hover' } },
            }}>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Booking ID</th>
                  <th>Service</th>
                  <th>Total Amount</th>
                  <th>Commission (15%)</th>
                  <th>Vendor Earnings</th>
                  <th>Payment Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {pagedBookings.map((b) => {
                   const comm = (Number(b.totalAmount || b.amount) * COMMISSION_RATE);
                   const earn = (Number(b.totalAmount || b.amount) - comm);
                   return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.customerName || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>#{(b.id || '').slice(0, 8)}</td>
                      <td>{b.serviceName || b.service || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(b.totalAmount || b.amount)}</td>
                      <td style={{ color: '#EF4444', fontWeight: 600 }}>-{formatCurrency(comm)}</td>
                      <td style={{ color: '#2e7d32', fontWeight: 700 }}>{formatCurrency(earn)}</td>
                      <td>
                        <Chip 
                          label={b.paymentMethod || 'Cash'} 
                          size="small"
                          variant="outlined"
                          color={b.paymentMethod?.toLowerCase() === 'online' ? 'success' : 'warning'}
                          sx={{ fontWeight: 700, height: 24, fontSize: '0.7rem' }} 
                        />
                      </td>
                      <td style={{ color: 'text.secondary' }}>{formatTimestamp(b.createdAt)}</td>
                    </tr>
                   );
                })}
                {pagedBookings.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>No earnings found</td></tr>}
              </tbody>
            </Box>
          </Box>
          <TablePagination component="div" count={filteredBookings.length} page={bookingPage} onPageChange={(_, p) => setBookingPage(p)}
            rowsPerPage={bookingRows} onRowsPerPageChange={(e) => { setBookingRows(parseInt(e.target.value)); setBookingPage(0); }}
          />
        </CardContent>
      </MotionCard>

      {/* Transactions Table Section */}
      <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Vendor Transactions</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {['all', 'completed', 'pending', 'cancelled'].map((s) => (
                  <Chip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} size="small"
                    onClick={() => { setStatusFilter(s); setTxnPage(0); }}
                    variant={statusFilter === s ? 'filled' : 'outlined'}
                    color={statusFilter === s ? 'primary' : 'default'}
                    sx={{ cursor: 'pointer', height: 26, fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
              <Button size="small" startIcon={<FileDownloadRoundedIcon />} onClick={exportTransactionsCSV}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
              >CSV</Button>
            </Box>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px',
              '& th': { textAlign: 'left', p: 1.5, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' },
              '& td': { p: 1.5, fontSize: '0.82rem' },
              '& tbody tr': { transition: 'all 0.15s ease', '&:hover': { bgcolor: 'action.hover' } },
            }}>
              <thead><tr><th>Booking ID</th><th>Customer</th><th>Amount</th><th>Commission</th><th>Vendor Earning</th><th>Payment Type</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {pagedTxns.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{(t.bookingId || t.id)?.slice(0, 8)}</td>
                    <td>{t.customerName || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</td>
                    <td style={{ color: '#FFB547' }}>{formatCurrency((t.amount || 0) * COMMISSION_RATE)}</td>
                    <td style={{ color: '#00D9A6', fontWeight: 600 }}>{formatCurrency((t.amount || 0) * (1 - COMMISSION_RATE))}</td>
                    <td>
                      <Chip 
                        label={paymentConfig[(t.paymentMethod || 'cash').toLowerCase()]?.label || 'Cash'} 
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.65rem', borderColor: (paymentConfig[(t.paymentMethod || 'cash').toLowerCase()]?.color || '#FFB547'), color: (paymentConfig[(t.paymentMethod || 'cash').toLowerCase()]?.color || '#FFB547') }}
                      />
                    </td>
                    <td><Chip label={statusConfig[t.status]?.label || t.status || 'Unknown'} color={statusConfig[t.status]?.color || 'default'} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem' }} /></td>
                    <td style={{ color: '#94A3B8' }}>{formatTimestamp(t.createdAt)}</td>
                  </tr>
                ))}
                {pagedTxns.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No transactions found</td></tr>}
              </tbody>
            </Box>
          </Box>
          <TablePagination component="div" count={filteredTxns.length} page={txnPage} onPageChange={(_, p) => setTxnPage(p)}
            rowsPerPage={txnRows} onRowsPerPageChange={(e) => { setTxnRows(parseInt(e.target.value)); setTxnPage(0); }}
          />
        </CardContent>
      </MotionCard>

      {/* Payout History */}
      <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', mb: 2 }}>
            <ReceiptLongRoundedIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
            Payout & Collection History
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px',
              '& th': { textAlign: 'left', p: 1.5, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' },
              '& td': { p: 1.5, fontSize: '0.82rem' },
            }}>
              <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td style={{ color: '#94A3B8' }}>{formatTimestamp(s.date)}</td>
                    <td>
                      <Chip 
                        label={s.type?.toUpperCase() || 'PAYOUT'} 
                        size="small" 
                        color={s.type === 'commission' ? 'warning' : 'success'} 
                        variant="filled" 
                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(s.amount)}</td>
                    <td><Chip label={s.status === 'completed' ? 'Completed' : s.status} color={s.status === 'completed' ? 'success' : 'warning'} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem' }} /></td>
                  </tr>
                ))}
                {settlements.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No history yet</td></tr>}
              </tbody>
            </Box>
          </Box>
        </CardContent>
      </MotionCard>
      <DeleteVendorModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        vendorName={vendor?.name || 'this vendor'}
      />
    </Box>
  );
};

export default VendorDetails;
