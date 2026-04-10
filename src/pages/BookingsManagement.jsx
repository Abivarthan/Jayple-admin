import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, TextField, InputAdornment, TablePagination, Button, Grid2 as Grid,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import { motion } from 'framer-motion';
import { subscribeToBookings, formatCurrency, formatTimestamp } from '../services/firestoreService';
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

const statusConfig = {
  completed: { color: 'success', label: 'Completed' },
  pending: { color: 'warning', label: 'Pending' },
  cancelled: { color: 'error', label: 'Cancelled' },
  failed: { color: 'error', label: 'Failed' },
  ongoing: { color: 'info', label: 'Ongoing' },
};

const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const unsub = subscribeToBookings(setBookings);
    return () => unsub && unsub();
  }, []);

  const filtered = bookings.filter((b) => {
    // Search match
    const matchSearch =
      (b.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.vendorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.service || '').toLowerCase().includes(search.toLowerCase());

    // Status match
    let matchStatus = statusFilter === 'all' || b.status === statusFilter;
    if (statusFilter === 'today') {
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      const today = new Date();
      matchStatus = bDate.toDateString() === today.toDateString();
    }

    // Date range match
    let matchDate = true;
    if (startDate || endDate) {
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      const start = startDate ? startOfDay(parseISO(startDate)) : new Date(0);
      const end = endDate ? endOfDay(parseISO(endDate)) : new Date(8640000000000000);
      matchDate = isWithinInterval(bDate, { start, end });
    }

    return matchSearch && matchStatus && matchDate;
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const exportCSV = () => {
    const headers = ['ID', 'Customer', 'Vendor', 'Service', 'Amount', 'Status', 'Date'];
    const rows = filtered.map((b) => [
      b.id || '', b.customerName || '', b.vendorName || '', b.service || '',
      b.amount || 0, b.status || '', formatTimestamp(b.createdAt),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    a.click();
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Bookings</Typography>
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={exportCSV} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
            Export CSV
          </Button>
        </Box>
      </motion.div>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid xs={12} md={4}>
              <TextField size="small" fullWidth placeholder="Search bookings..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /></InputAdornment> }}
              />
            </Grid>
            <Grid xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['all', 'today', 'pending', 'completed', 'cancelled'].map((s) => (
                  <Chip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} onClick={() => { setStatusFilter(s); setPage(0); }}
                    variant={statusFilter === s ? 'filled' : 'outlined'} color={statusFilter === s ? 'primary' : 'default'} sx={{ cursor: 'pointer', height: 32 }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField label="From" type="date" size="small" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                <TextField label="To" type="date" size="small" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                <Button size="small" onClick={() => { setStartDate(''); setEndDate(''); }} sx={{ minWidth: 'auto', color: 'text.secondary' }}>Clear</Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px',
              '& th': { textAlign: 'left', p: 2, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' },
              '& td': { p: 2, fontSize: '0.85rem' },
              '& tbody tr': { transition: 'all 0.2s ease', '&:hover': { bgcolor: 'action.hover' } },
            }}>
              <thead>
                <tr><th>Booking ID</th><th>Customer</th><th>Vendor</th><th>Service</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {paged.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{(b.id || '').slice(0, 8)}</td>
                    <td>{b.customerName || '—'}</td>
                    <td>{b.vendorName || '—'}</td>
                    <td>{b.service || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(b.amount)}</td>
                    <td><Chip label={statusConfig[b.status]?.label || b.status || 'Unknown'} color={statusConfig[b.status]?.color || 'default'} size="small" variant="outlined" /></td>
                    <td style={{ color: '#94A3B8' }}>{formatTimestamp(b.createdAt)}</td>
                  </tr>
                ))}
                {paged.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No bookings found</td></tr>}
              </tbody>
            </Box>
          </Box>
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          />
        </Card>
      </motion.div>
    </Box>
  );
};

export default BookingsManagement;
