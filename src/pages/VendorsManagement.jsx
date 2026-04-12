import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, TextField, InputAdornment,
  IconButton, Button, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, TablePagination,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { motion } from 'framer-motion';
import { subscribeToVendors, updateVendorStatus, deleteVendor, formatCurrency, formatTimestamp } from '../services/firestoreService';
import DeleteVendorModal from '../components/DeleteVendorModal';

const statusConfig = {
  approved: { color: 'success', label: 'Approved' },
  pending: { color: 'warning', label: 'Pending' },
  suspended: { color: 'error', label: 'Suspended' },
  rejected: { color: 'error', label: 'Rejected' },
};

const VendorsManagement = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToVendors(setVendors);
    return () => unsub && unsub();
  }, []);

  const filtered = vendors.filter((v) => {
    const matchSearch =
      (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.businessName || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.phone || '').includes(search);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleAction = async (action) => {
    if (selectedVendor) {
      await updateVendorStatus(selectedVendor.id, action);
    }
    setAnchorEl(null);
    setSelectedVendor(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedVendor) {
      await deleteVendor(selectedVendor.id);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Business', 'Phone', 'Status', 'City', 'Wallet Balance', 'Created'];
    const rows = filtered.map((v) => [
      v.name || '', v.businessName || '', v.phone || '', v.status || '', v.city || '',
      v.walletBalance || 0, formatTimestamp(v.createdAt),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendors.csv';
    a.click();
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Vendors</Typography>
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={exportCSV} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
            Export CSV
          </Button>
        </Box>
      </motion.div>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" placeholder="Search vendors..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ flex: 1, minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /></InputAdornment> }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['all', 'pending', 'approved', 'suspended'].map((s) => (
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
              '& tbody tr': { cursor: 'pointer', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'action.hover' } },
            }}>
              <thead>
                <tr><th>Vendor</th><th>Business</th><th>Phone</th><th>City</th><th>Wallet</th><th>Status</th><th>Created</th><th style={{ width: 60 }}>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map((v) => (
                  <tr key={v.id} onClick={() => navigate(`/vendors/${v.id}`)}>
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700, bgcolor: '#7C5CFC' }}>{(v.name || '?')[0]?.toUpperCase()}</Avatar>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.name || '—'}</Typography>
                      </Box>
                    </td>
                    <td>{v.businessName || v.name || '—'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{v.phone || '—'}</td>
                    <td>{v.city || v.location || '—'}</td>
                    <td style={{ fontWeight: 600, color: (v.walletBalance || 0) > 0 ? '#00D9A6' : 'inherit' }}>
                      {formatCurrency(v.walletBalance)}
                    </td>
                    <td><Chip label={statusConfig[v.status]?.label || v.status || 'Unknown'} color={statusConfig[v.status]?.color || 'default'} size="small" variant="outlined" /></td>
                    <td style={{ color: '#94A3B8' }}>{formatTimestamp(v.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedVendor(v); }}>
                        <MoreVertRoundedIcon sx={{ fontSize: '1.1rem' }} />
                      </IconButton>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem', cursor: 'default' }}>No vendors found</td></tr>}
              </tbody>
            </Box>
          </Box>
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          />
        </Card>
      </motion.div>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 180 } }}>
        <MenuItem onClick={() => { setAnchorEl(null); if (selectedVendor) navigate(`/vendors/${selectedVendor.id}`); }}>
          <ListItemIcon><OpenInNewRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('approved')}>
          <ListItemIcon><CheckCircleRoundedIcon fontSize="small" sx={{ color: 'success.main' }} /></ListItemIcon>
          <ListItemText>Approve</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('rejected')}>
          <ListItemIcon><CancelRoundedIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Reject</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('suspended')}>
          <ListItemIcon><BlockRoundedIcon fontSize="small" sx={{ color: 'warning.main' }} /></ListItemIcon>
          <ListItemText>Suspend</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); setIsDeleteModalOpen(true); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteOutlineRoundedIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Delete Vendor</ListItemText>
        </MenuItem>
      </Menu>

      <DeleteVendorModal
        open={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedVendor(null); }}
        onConfirm={handleDeleteConfirm}
        vendorName={selectedVendor?.name || 'this vendor'}
      />
    </Box>
  );
};

export default VendorsManagement;
