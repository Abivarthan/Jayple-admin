import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, TextField, InputAdornment,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { motion } from 'framer-motion';
import { subscribeToDisputes, updateDisputeStatus } from '../services/firestoreService';

const statusConfig = {
  open: { color: 'warning', label: 'Open' },
  resolved: { color: 'success', label: 'Resolved' },
  rejected: { color: 'error', label: 'Rejected' },
};

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionDialog, setActionDialog] = useState({ open: false, dispute: null, action: '' });

  useEffect(() => {
    const unsub = subscribeToDisputes(setDisputes);
    return () => unsub && unsub();
  }, []);

  const filtered = disputes.filter((d) => {
    const matchSearch =
      (d.bookingId || d.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.vendorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.issue || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleAction = async () => {
    const { dispute, action } = actionDialog;
    if (dispute && action) await updateDisputeStatus(dispute.id, action);
    setActionDialog({ open: false, dispute: null, action: '' });
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Disputes</Typography>
      </motion.div>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" placeholder="Search disputes..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ flex: 1, minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /></InputAdornment> }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['all', 'open', 'resolved', 'rejected'].map((s) => (
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
              <thead><tr><th>Booking ID</th><th>Customer</th><th>Vendor</th><th>Issue</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {paged.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{(d.bookingId || d.id)?.slice(0, 8)}</td>
                    <td>{d.customerName || '—'}</td>
                    <td>{d.vendorName || '—'}</td>
                    <td style={{ maxWidth: 250 }}>
                      <Typography sx={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.issue || '—'}</Typography>
                    </td>
                    <td><Chip label={statusConfig[d.status]?.label || d.status || 'Open'} color={statusConfig[d.status]?.color || 'warning'} size="small" variant="outlined" /></td>
                    <td>
                      {d.status === 'open' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined" color="success" startIcon={<CheckCircleRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                            onClick={() => setActionDialog({ open: true, dispute: d, action: 'resolved' })}
                            sx={{ borderRadius: 2.5, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                          >Resolve</Button>
                          <Button size="small" variant="outlined" color="error" startIcon={<CancelRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                            onClick={() => setActionDialog({ open: true, dispute: d, action: 'rejected' })}
                            sx={{ borderRadius: 2.5, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                          >Reject</Button>
                        </Box>
                      )}
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No disputes found</td></tr>}
              </tbody>
            </Box>
          </Box>
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          />
        </Card>
      </motion.div>

      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, dispute: null, action: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{actionDialog.action === 'resolved' ? 'Resolve Dispute' : 'Reject Dispute'}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {actionDialog.action === 'resolved' ? 'resolve' : 'reject'} this dispute?</Typography>
          {actionDialog.dispute && (
            <Card variant="outlined" sx={{ mt: 2, borderRadius: 3, p: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Booking:</strong> #{(actionDialog.dispute.bookingId || actionDialog.dispute.id)?.slice(0, 8)}</Typography>
              <Typography variant="body2"><strong>Issue:</strong> {actionDialog.dispute.issue}</Typography>
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setActionDialog({ open: false, dispute: null, action: '' })} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" color={actionDialog.action === 'resolved' ? 'success' : 'error'} onClick={handleAction} sx={{ borderRadius: 3 }}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Disputes;
