import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, TextField, InputAdornment, Avatar, TablePagination, Button,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { motion } from 'framer-motion';
import { subscribeToUsers } from '../services/firestoreService';

const CustomersManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const unsub = subscribeToUsers((allUsers) => {
      setUsers(allUsers.filter((u) => u.role !== 'admin' && u.role !== 'vendor'));
    });
    return () => unsub && unsub();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.phone || '').includes(search);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && u.status !== 'inactive') || (statusFilter === 'inactive' && u.status === 'inactive');
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Total Bookings', 'Wallet Balance', 'Status'];
    const rows = filtered.map((u) => [u.name || '', u.phone || '', u.totalBookings || 0, u.walletBalance || 0, u.status || 'active']);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Customers</Typography>
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={exportCSV} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>Export CSV</Button>
        </Box>
      </motion.div>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" placeholder="Search customers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ flex: 1, minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /></InputAdornment> }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['all', 'active', 'inactive'].map((s) => (
                <Chip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} onClick={() => { setStatusFilter(s); setPage(0); }}
                  variant={statusFilter === s ? 'filled' : 'outlined'} color={statusFilter === s ? 'primary' : 'default'} sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
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
              <thead><tr><th>Customer</th><th>Phone</th><th>Total Bookings</th><th>Wallet Balance</th><th>Status</th></tr></thead>
              <tbody>
                {paged.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700, bgcolor: '#00D9A6' }}>{(u.name || '?')[0]?.toUpperCase()}</Avatar>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name || '—'}</Typography>
                      </Box>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{u.phone || '—'}</td>
                    <td>{u.totalBookings || 0}</td>
                    <td style={{ fontWeight: 600 }}>₹{(u.walletBalance || 0).toLocaleString()}</td>
                    <td><Chip label={u.status === 'inactive' ? 'Inactive' : 'Active'} color={u.status === 'inactive' ? 'error' : 'success'} size="small" variant="outlined" /></td>
                  </tr>
                ))}
                {paged.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No customers found</td></tr>}
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

export default CustomersManagement;
