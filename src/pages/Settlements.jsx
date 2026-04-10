import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, TextField, InputAdornment, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Grid2 as Grid,
  Divider, Alert, TablePagination, Snackbar,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { motion } from 'framer-motion';
import {
  subscribeToVendors, subscribeToSettlements, handlePayout,
  formatTimestamp, formatCurrency, getNextTuesday,
} from '../services/firestoreService';

const MotionCard = motion(Card);
const COMMISSION_RATE = 0.10;

const Settlements = () => {
  const [vendors, setVendors] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutVendor, setPayoutVendor] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    const unsubs = [
      subscribeToVendors(setVendors),
      subscribeToSettlements(setSettlements),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, []);

  // Build settlement view data from vendors
  const vendorData = vendors.map((v) => {
    const totalEarnings = v.totalEarnings || 0;
    const commission = v.commission || totalEarnings * COMMISSION_RATE;
    const walletBalance = v.walletBalance || 0;
    const pendingAmount = walletBalance;
    const lastPayout = v.lastPayout;
    const vendorSettlements = settlements.filter((s) => s.vendorId === v.id);

    return {
      ...v,
      totalEarnings,
      platformCommission: commission,
      availableBalance: walletBalance,
      pendingAmount,
      lastPayoutDate: lastPayout,
      payoutCount: vendorSettlements.length,
    };
  });

  // Filters
  const filtered = vendorData.filter((v) => {
    const matchSearch =
      (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.businessName || '').toLowerCase().includes(search.toLowerCase());
    const matchBalance =
      balanceFilter === 'all' ||
      (balanceFilter === 'has_balance' && v.availableBalance > 0) ||
      (balanceFilter === 'zero' && v.availableBalance === 0);
    return matchSearch && matchBalance;
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Payout handler
  const onConfirmPayout = async () => {
    if (!payoutVendor || payoutVendor.availableBalance <= 0) return;
    setPayoutLoading(true);
    try {
      await handlePayout(
        payoutVendor.id,
        payoutVendor.name,
        payoutVendor.availableBalance,
        'bank_transfer'
      );
      setSnackbar({ open: true, message: `✅ Payout of ${formatCurrency(payoutVendor.availableBalance)} to ${payoutVendor.name} completed!` });
      setPayoutDialogOpen(false);
      setPayoutVendor(null);
    } catch (err) {
      console.error('Payout failed:', err);
      setSnackbar({ open: true, message: '❌ Payout failed. Please try again.' });
    }
    setPayoutLoading(false);
  };

  // Summary stats
  const totalWalletBalance = vendorData.reduce((s, v) => s + v.availableBalance, 0);
  const totalCommission = vendorData.reduce((s, v) => s + v.platformCommission, 0);
  const totalPaidOut = settlements.reduce((s, p) => s + (p.amount || 0), 0);
  const vendorsWithBalance = vendorData.filter((v) => v.availableBalance > 0).length;

  // Export settlements
  const exportSettlementsCSV = () => {
    const headers = ['Date', 'Vendor', 'Amount', 'Method', 'Status'];
    const rows = settlements.map((s) => [
      formatTimestamp(s.date), s.vendorName || '', s.amount || 0,
      s.payoutMethod || '', s.status || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settlements.csv';
    a.click();
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Settlements</Typography>
      </motion.div>

      {vendorsWithBalance > 0 && (
        <Alert severity="info" icon={<AccountBalanceWalletRoundedIcon />} sx={{ mb: 3, borderRadius: 3, fontWeight: 500 }}>
          {vendorsWithBalance} vendor(s) have pending balance ready for payout. Next Tuesday: {getNextTuesday().toLocaleDateString()}.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'TOTAL VENDOR BALANCES', value: formatCurrency(totalWalletBalance), icon: <AccountBalanceWalletRoundedIcon />, gradient: 'linear-gradient(135deg, #7C5CFC 0%, #9F85FD 100%)' },
          { label: 'PLATFORM COMMISSION', value: formatCurrency(totalCommission), icon: <ScheduleRoundedIcon />, gradient: 'linear-gradient(135deg, #FFB547 0%, #FFCF7D 100%)' },
          { label: 'TOTAL PAID OUT', value: formatCurrency(totalPaidOut), icon: <CheckCircleRoundedIcon />, gradient: 'linear-gradient(135deg, #00D9A6 0%, #33E1B8 100%)' },
          { label: 'VENDORS WITH BALANCE', value: vendorsWithBalance, icon: <WarningAmberRoundedIcon />, gradient: 'linear-gradient(135deg, #38BDF8 0%, #7DD3FC 100%)' },
        ].map((card, i) => (
          <Grid xs={12} sm={6} md={3} key={card.label}>
            <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} sx={{ position: 'relative', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontSize: '0.65rem' }}>{card.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{card.value}</Typography>
                  </Box>
                  <Box sx={{ width: 46, height: 46, borderRadius: 3, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
              <Box sx={{ height: 3, background: card.gradient }} />
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" placeholder="Search by vendor name or ID..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ flex: 1, minWidth: 260 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /></InputAdornment> }}
            />
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'has_balance', label: 'Has Balance' },
                { key: 'zero', label: 'Zero Balance' },
              ].map((f) => (
                <Chip key={f.key} label={f.label} onClick={() => { setBalanceFilter(f.key); setPage(0); }}
                  variant={balanceFilter === f.key ? 'filled' : 'outlined'}
                  color={balanceFilter === f.key ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Vendor Account Balances Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px',
              '& th': { textAlign: 'left', p: 2, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' },
              '& td': { p: 2, fontSize: '0.85rem' },
              '& tbody tr': { transition: 'all 0.2s ease', '&:hover': { bgcolor: 'action.hover' } },
            }}>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Vendor ID</th>
                  <th>Total Earnings</th>
                  <th>Commission</th>
                  <th>Available Balance</th>
                  <th>Pending Amount</th>
                  <th>Last Payout</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700, bgcolor: '#7C5CFC' }}>
                          {(v.name || '?')[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.name || '—'}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{v.businessName || ''}</Typography>
                        </Box>
                      </Box>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94A3B8' }}>{v.id?.slice(0, 12)}...</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(v.totalEarnings)}</td>
                    <td style={{ color: '#FFB547' }}>{formatCurrency(v.platformCommission)}</td>
                    <td style={{ fontWeight: 700, color: v.availableBalance > 0 ? '#00D9A6' : 'inherit' }}>
                      {formatCurrency(v.availableBalance)}
                    </td>
                    <td style={{ fontWeight: 600, color: v.pendingAmount > 0 ? '#FF5C6C' : '#00D9A6' }}>
                      {formatCurrency(v.pendingAmount)}
                    </td>
                    <td style={{ color: '#94A3B8' }}>{formatTimestamp(v.lastPayoutDate)}</td>
                    <td>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={v.availableBalance <= 0}
                        startIcon={<PaymentRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                        onClick={() => { setPayoutVendor(v); setPayoutDialogOpen(true); }}
                        sx={{
                          borderRadius: 2.5, textTransform: 'none', fontSize: '0.75rem', py: 0.6, px: 1.5, fontWeight: 600,
                          background: v.availableBalance > 0
                            ? 'linear-gradient(135deg, #00D9A6 0%, #00B38A 100%)'
                            : undefined,
                          '&:hover': v.availableBalance > 0 ? { background: 'linear-gradient(135deg, #33E1B8 0%, #00D9A6 100%)' } : {},
                        }}
                      >
                        Payout
                      </Button>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No vendors found</td></tr>
                )}
              </tbody>
            </Box>
          </Box>
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          />
        </Card>
      </motion.div>

      {/* Settlement History */}
      <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} sx={{ mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              <ReceiptLongRoundedIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
              Settlement History
            </Typography>
            <Button size="small" startIcon={<FileDownloadRoundedIcon />} onClick={exportSettlementsCSV}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >Export</Button>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px',
              '& th': { textAlign: 'left', p: 1.5, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' },
              '& td': { p: 1.5, fontSize: '0.85rem' },
            }}>
              <thead><tr><th>Date</th><th>Vendor</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {settlements.slice(0, 15).map((s) => (
                  <tr key={s.id}>
                    <td style={{ color: '#94A3B8' }}>{formatTimestamp(s.date)}</td>
                    <td style={{ fontWeight: 600 }}>{s.vendorName || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(s.amount)}</td>
                    <td>{s.payoutMethod || 'Bank Transfer'}</td>
                    <td><Chip label={s.status === 'completed' ? 'Completed' : s.status || 'Pending'} color={s.status === 'completed' ? 'success' : 'warning'} size="small" variant="outlined" /></td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No settlements yet</td></tr>
                )}
              </tbody>
            </Box>
          </Box>
        </CardContent>
      </MotionCard>

      {/* Payout Confirmation Dialog */}
      <Dialog open={payoutDialogOpen} onClose={() => setPayoutDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Confirm Payout</DialogTitle>
        <DialogContent>
          {payoutVendor && (
            <Box>
              <Typography sx={{ mb: 2.5, color: 'text.secondary' }}>
                Are you sure you want to payout <strong style={{ color: '#F1F5F9' }}>{formatCurrency(payoutVendor.availableBalance)}</strong> to <strong style={{ color: '#F1F5F9' }}>{payoutVendor.name}</strong>?
              </Typography>
              <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    ['Vendor', payoutVendor.name],
                    ['Vendor ID', payoutVendor.id?.slice(0, 16) + '...'],
                    ['Payout Amount', formatCurrency(payoutVendor.availableBalance)],
                    ['Method', 'Bank Transfer'],
                  ].map(([label, val]) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{val}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    ⚠️ This will set the vendor's wallet balance to ₹0 and create a settlement record.
                  </Typography>
                </Box>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setPayoutDialogOpen(false)} sx={{ borderRadius: 3 }} disabled={payoutLoading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onConfirmPayout} disabled={payoutLoading}
            sx={{ borderRadius: 3, px: 3, background: 'linear-gradient(135deg, #00D9A6 0%, #00B38A 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #33E1B8 0%, #00D9A6 100%)' },
            }}
          >
            {payoutLoading ? 'Processing...' : 'Confirm Payout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{ sx: { borderRadius: 3, fontWeight: 600 } }}
      />
    </Box>
  );
};

export default Settlements;
