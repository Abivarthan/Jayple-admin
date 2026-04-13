import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, TextField, InputAdornment, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Grid2 as Grid,
  Divider, Alert, TablePagination, Snackbar, Tabs, Tab,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import { motion } from 'framer-motion';
import {
  subscribeToVendors, subscribeToSettlements, subscribeToBookings, handlePayout, handleCollectCommission,
  formatTimestamp, formatCurrency, getNextTuesday,
} from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';

const MotionCard = motion(Card);
const COMMISSION_RATE = 0.15;

const Settlements = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    const unsubs = [
      subscribeToVendors(setVendors),
      subscribeToSettlements(setSettlements),
      subscribeToBookings(setAllBookings),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, []);

  // Build settlement view data from vendors
  const vendorData = vendors.map((v) => {
    const vendorBookings = allBookings.filter(b => b.vendorId === v.id && b.status === 'completed');
    const vendorSettlements = settlements.filter(s => s.vendorId === v.id && s.status === 'completed');

    const totalEarnings = vendorBookings.reduce((sum, b) => sum + (Number(b.totalAmount || b.amount) || 0), 0);
    const platformCommission = vendorBookings.reduce((sum, b) => sum + (Number(b.totalAmount || b.amount) * COMMISSION_RATE), 0);
    
    // Calculate total online earnings (85% of online part to vendor)
    const totalOnlineEarnings = vendorBookings.reduce((sum, b) => {
      const onlinePart = Number(b.paidOnline || (b.paymentMethod?.toLowerCase() === 'online' ? (b.totalAmount || b.amount) : 0));
      return sum + (onlinePart * (1 - COMMISSION_RATE));
    }, 0);
    
    // Calculate total cash commission (15% of cash part to platform)
    const totalCashCommission = vendorBookings.reduce((sum, b) => {
      const cashPart = Number(b.payAtStore || (b.paymentMethod?.toLowerCase() === 'cash' || !b.paymentMethod ? (b.totalAmount || b.amount) : 0));
      return sum + (cashPart * COMMISSION_RATE);
    }, 0);

    // Subtract recorded settlements to get current balances
    const totalPaidOut = vendorSettlements.filter(s => s.type === 'payout').reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalCollected = vendorSettlements.filter(s => s.type === 'commission').reduce((sum, s) => sum + (s.amount || 0), 0);

    // Dynamic Wallet & Due (Calculated from bookings - settlements)
    const walletBalance = Math.max(0, totalOnlineEarnings - totalPaidOut);
    const vendorDue = Math.max(0, totalCashCommission - totalCollected);

    return {
      ...v,
      totalEarnings,
      platformCommission,
      walletBalance: Number(walletBalance.toFixed(2)),
      vendorDue: Number(vendorDue.toFixed(2)),
    };
  });

  // Filters
  const filtered = vendorData.filter((v) => {
    const matchSearch =
      (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.storeName || v.businessName || '').toLowerCase().includes(search.toLowerCase());
    const matchBalance =
      balanceFilter === 'all' ||
      (balanceFilter === 'has_balance' && (v.walletBalance > 0 || v.vendorDue > 0)) ||
      (balanceFilter === 'zero' && v.walletBalance === 0 && v.vendorDue === 0);
    return matchSearch && matchBalance;
  });

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Pay Vendor Handler (Platform -> Vendor)
  const handlePayVendor = async (v, amount) => {
    if (!v || amount <= 0) return;
    setActionLoading(true);
    try {
      await handlePayout(v.id, v.name || v.businessName || 'Vendor', amount);
      setSnackbar({ open: true, message: `✅ Payout of ${formatCurrency(amount)} processed for ${v.name}!` });
      setPayoutDialogOpen(false);
      setSelectedVendor(null);
    } catch (err) {
      console.error('Payout failed:', err);
      setSnackbar({ open: true, message: '❌ Payout failed. Check console for details.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Collect Due Handler (Vendor -> Platform)
  const handleCollectDue = async (v, amount) => {
    if (!v || amount <= 0) return;
    setActionLoading(true);
    try {
      await handleCollectCommission(v.id, v.name || v.businessName || 'Vendor', amount);
      setSnackbar({ open: true, message: `✅ Commission of ${formatCurrency(amount)} collected from ${v.name}!` });
      setCollectDialogOpen(false);
      setSelectedVendor(null);
    } catch (err) {
      console.error('Collection failed:', err);
      setSnackbar({ open: true, message: '❌ Collection failed. Check console for details.' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalWallet = vendorData.reduce((s, v) => s + v.walletBalance, 0);
  const totalDue = vendorData.reduce((s, v) => s + v.vendorDue, 0);
  const totalCommission = settlements.filter(s => s.type === 'commission').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaidOut = settlements.filter(s => s.type === 'payout').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Settlements & Commission</Typography>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Vendor Balances" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label="Settlement History" sx={{ fontWeight: 700, textTransform: 'none' }} />
          </Tabs>
        </Box>
      </motion.div>

      {activeTab === 0 ? (
        <>
      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          { label: 'PLATFORM OWES VENDORS', value: formatCurrency(totalWallet), icon: <AccountBalanceWalletRoundedIcon />, gradient: 'linear-gradient(135deg, #7C5CFC 0%, #9F85FD 100%)' },
          { label: 'VENDORS OWE PLATFORM', value: formatCurrency(totalDue), icon: <WarningAmberRoundedIcon />, gradient: 'linear-gradient(135deg, #FFB547 0%, #FFCF7D 100%)' },
          { label: 'TOTAL PAID OUT', value: formatCurrency(totalPaidOut), icon: <CheckCircleRoundedIcon />, gradient: 'linear-gradient(135deg, #00D9A6 0%, #33E1B8 100%)' },
          { label: 'COMMISSION COLLECTED', value: formatCurrency(totalCommission), icon: <AttachMoneyRoundedIcon />, gradient: 'linear-gradient(135deg, #38BDF8 0%, #7DD3FC 100%)' },
        ].map((card, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
            <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} sx={{ position: 'relative', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontSize: '0.65rem', fontWeight: 700 }}>{card.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{card.value}</Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, borderRadius: 3, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
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
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" placeholder="Search vendors..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ flex: 1, minWidth: 260 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /></InputAdornment> }}
            />
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['all', 'has_balance', 'zero'].map((f) => (
                <Chip key={f} label={f.replace('_', ' ').toUpperCase()} onClick={() => { setBalanceFilter(f); setPage(0); }}
                  variant={balanceFilter === f ? 'filled' : 'outlined'}
                  color={balanceFilter === f ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer', fontWeight: 600, px: 1 }}
                />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Account Balances Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px',
              '& th': { textAlign: 'left', p: 2, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' },
              '& td': { p: 2, fontSize: '0.85rem' },
              '& tbody tr': { transition: 'all 0.2s ease', '&:hover': { bgcolor: 'action.hover' } },
            }}>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Total Earnings</th>
                  <th>Platform Commission</th>
                  <th>Vendor Wallet</th>
                  <th>Vendor Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate(`/vendors/${v.id}`)}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 800, bgcolor: 'primary.main' }}>
                          {(v.name || '?')[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{v.name || '—'}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>ID: {v.id?.slice(0, 8)}</Typography>
                        </Box>
                      </Box>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(v.totalEarnings)}</td>
                    <td style={{ color: 'text.secondary' }}>{formatCurrency(v.platformCommission)}</td>
                    <td style={{ fontWeight: 800, color: v.walletBalance > 0 ? '#10B981' : 'inherit' }}>
                      {formatCurrency(v.walletBalance)}
                      {v.walletBalance > 0 && <Typography variant="caption" display="block" color="success.main" sx={{ fontSize: '0.6rem' }}>Platform owes Vendor</Typography>}
                    </td>
                    <td style={{ fontWeight: 800, color: v.vendorDue > 0 ? '#F59E0B' : 'inherit' }}>
                      {formatCurrency(v.vendorDue)}
                      {v.vendorDue > 0 && <Typography variant="caption" display="block" color="warning.main" sx={{ fontSize: '0.6rem' }}>Vendor owes Platform</Typography>}
                    </td>
                    <td>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small" variant="contained"
                          disabled={v.walletBalance <= 0}
                          onClick={() => { setSelectedVendor(v); setPayoutDialogOpen(true); }}
                          sx={{ borderRadius: 2, textTransform: 'none', px: 1.5, fontSize: '0.75rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                        >
                          Pay Vendor
                        </Button>
                        <Button
                          size="small" variant="contained"
                          disabled={v.vendorDue <= 0}
                          onClick={() => { setSelectedVendor(v); setCollectDialogOpen(true); }}
                          sx={{ borderRadius: 2, textTransform: 'none', px: 1.5, fontSize: '0.75rem', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
                        >
                          Collect Due
                        </Button>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          />
        </Card>
      </motion.div>
      </>
      ) : (
      /* Settlement History Tab */
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <TextField size="small" fullWidth placeholder="Search by vendor name or ID..." value={historySearch}
              onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /></InputAdornment> }}
            />
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px',
              '& th': { textAlign: 'left', p: 2, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' },
              '& td': { p: 2, fontSize: '0.85rem' },
            }}>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {settlements
                  .filter(s => (s.vendorName || '').toLowerCase().includes(historySearch.toLowerCase()) || (s.vendorId || '').toLowerCase().includes(historySearch.toLowerCase()))
                  .slice(historyPage * historyRowsPerPage, historyPage * historyRowsPerPage + historyRowsPerPage)
                  .map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Typography sx={{ fontWeight: 700 }}>{s.vendorName || 'Unknown Vendor'}</Typography>
                      <Typography variant="caption" color="text.secondary">ID: {s.vendorId?.slice(0, 8)}</Typography>
                    </td>
                    <td>
                      <Chip label={s.type?.toUpperCase()} size="small" color={s.type === 'commission' ? 'warning' : 'success'} sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }} />
                    </td>
                    <td style={{ fontWeight: 800 }}>{formatCurrency(s.amount)}</td>
                    <td style={{ color: 'text.secondary' }}>{s.method || '—'}</td>
                    <td>{formatTimestamp(s.date)}</td>
                    <td><Chip label="Completed" size="small" variant="outlined" color="success" sx={{ fontSize: '0.65rem', height: 20 }} /></td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
          <TablePagination component="div" count={settlements.length} page={historyPage} onPageChange={(_, p) => setHistoryPage(p)}
            rowsPerPage={historyRowsPerPage} onRowsPerPageChange={(e) => { setHistoryRowsPerPage(parseInt(e.target.value)); setHistoryPage(0); }}
          />
        </Card>
      </motion.div>
      )}

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onClose={() => setPayoutDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Payout</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Typography>Are you sure you want to process a payout of <b>{formatCurrency(selectedVendor.walletBalance)}</b> to <b>{selectedVendor.name}</b>?</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPayoutDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handlePayVendor(selectedVendor, selectedVendor.walletBalance)} disabled={actionLoading} sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            {actionLoading ? 'Processing...' : 'Confirm Payout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Collection Dialog */}
      <Dialog open={collectDialogOpen} onClose={() => setCollectDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Collect Commission</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Typography>Confirm collect ₹<b>{selectedVendor.vendorDue}</b>?</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCollectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleCollectDue(selectedVendor, selectedVendor.vendorDue)} disabled={actionLoading} sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
            {actionLoading ? 'Processing...' : 'Confirm Collect'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Box>
  );
};
export default Settlements;
