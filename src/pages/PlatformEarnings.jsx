import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, TextField, InputAdornment, TablePagination, Button, Avatar,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { motion } from 'framer-motion';
import { subscribeToBookings, formatCurrency, formatTimestamp } from '../services/firestoreService';

const COMMISSION_RATE = 0.15;

const PlatformEarnings = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const unsub = subscribeToBookings((all) => {
      setBookings(all.filter(b => b.status === 'completed'));
    });
    return () => unsub && unsub();
  }, []);

  const filtered = bookings.filter((b) => {
    const matchSearch = 
      (b.vendorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalRevenue = filtered.reduce((s, b) => s + (Number(b.totalAmount || b.amount) * COMMISSION_RATE), 0);

  const exportCSV = () => {
    const headers = ['Vendor Name', 'Customer', 'Booking ID', 'Total Amount', 'Commission', 'Payment Type', 'Date'];
    const rows = filtered.map((b) => [
      b.vendorName || '—', b.customerName || '—', b.id || '', b.totalAmount || b.amount || 0,
      (Number(b.totalAmount || b.amount) * COMMISSION_RATE).toFixed(2),
      b.paymentMethod || 'Cash', formatTimestamp(b.createdAt)
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'platform_earnings.csv';
    a.click();
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Platform Earnings</Typography>
            <Typography variant="body2" color="text.secondary">Total Revenue: <b>{formatCurrency(totalRevenue)}</b></Typography>
          </Box>
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={exportCSV} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>Export Report</Button>
        </Box>
      </motion.div>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <TextField size="small" fullWidth placeholder="Search by vendor, customer or booking ID..." value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /></InputAdornment> }}
          />
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px',
              '& th': { textAlign: 'left', p: 2, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' },
              '& td': { p: 2, fontSize: '0.85rem' },
            }}>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Customer</th>
                  <th>Booking ID</th>
                  <th>Total Amount</th>
                  <th>Commission (15%)</th>
                  <th>Payment Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((b) => {
                  const comm = b.commission || (Number(b.totalAmount || b.amount) * COMMISSION_RATE);
                  return (
                    <tr key={b.id}>
                      <td>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: 'primary.light' }}>{b.vendorName?.[0]}</Avatar>
                          <Typography sx={{ fontWeight: 600 }}>{b.vendorName}</Typography>
                        </Box>
                      </td>
                      <td>{b.customerName}</td>
                      <td style={{ fontFamily: 'monospace' }}>#{(b.id || '').slice(0, 8)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(b.totalAmount || b.amount)}</td>
                      <td style={{ color: 'success.main', fontWeight: 700 }}>{formatCurrency(comm)}</td>
                      <td>
                        <Chip label={b.paymentMethod || 'Cash'} size="small" variant="outlined" 
                          color={b.paymentMethod?.toLowerCase() === 'online' ? 'success' : 'warning'} 
                          sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem' }} 
                        />
                      </td>
                      <td style={{ color: 'text.secondary' }}>{formatTimestamp(b.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Box>
          </Box>
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          />
        </Card>
      </motion.div>
    </Box>
  );
};

export default PlatformEarnings;
