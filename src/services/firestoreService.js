import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// ── Users ──
export const subscribeToUsers = (callback) => {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(users);
  });
};

// ── Vendors ──
export const subscribeToVendors = (callback) => {
  return onSnapshot(
    query(collection(db, 'users'), where('role', '==', 'vendor')),
    (snapshot) => {
      const vendors = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(vendors);
    }
  );
};

export const subscribeToVendorsLegacy = (callback) => {
  return onSnapshot(collection(db, 'vendors'), (snapshot) => {
    const vendors = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(vendors);
  });
};

export const updateVendorStatus = async (vendorId, status) => {
  await updateDoc(doc(db, 'users', vendorId), { status, updatedAt: serverTimestamp() });
};

export const getVendorById = async (vendorId) => {
  const snap = await getDoc(doc(db, 'users', vendorId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const subscribeToVendorById = (vendorId, callback) => {
  return onSnapshot(doc(db, 'users', vendorId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
};

// ── Bookings ──
export const subscribeToBookings = (callback) => {
  return onSnapshot(collection(db, 'bookings'), (snapshot) => {
    const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(bookings);
  });
};

export const subscribeToVendorBookings = (vendorId, callback) => {
  return onSnapshot(
    query(collection(db, 'bookings'), where('vendorId', '==', vendorId)),
    (snapshot) => {
      const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(bookings);
    }
  );
};

// ── Transactions ──
export const subscribeToTransactions = (callback) => {
  return onSnapshot(collection(db, 'transactions'), (snapshot) => {
    const txns = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(txns);
  });
};

export const subscribeToVendorTransactions = (vendorId, callback) => {
  return onSnapshot(
    query(collection(db, 'transactions'), where('vendorId', '==', vendorId)),
    (snapshot) => {
      const txns = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(txns);
    }
  );
};

// ── Disputes ──
export const subscribeToDisputes = (callback) => {
  return onSnapshot(collection(db, 'disputes'), (snapshot) => {
    const disputes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(disputes);
  });
};

export const updateDisputeStatus = async (disputeId, status) => {
  await updateDoc(doc(db, 'disputes', disputeId), { status, resolvedAt: serverTimestamp() });
};

// ── Settlements ──
export const subscribeToSettlements = (callback) => {
  return onSnapshot(
    query(collection(db, 'settlements'), orderBy('date', 'desc')),
    (snapshot) => {
      const settlements = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(settlements);
    }
  );
};

export const subscribeToVendorSettlements = (vendorId, callback) => {
  return onSnapshot(
    query(collection(db, 'settlements'), where('vendorId', '==', vendorId), orderBy('date', 'desc')),
    (snapshot) => {
      const settlements = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(settlements);
    }
  );
};

/**
 * Handle Payout:
 * 1. Read vendor's walletBalance
 * 2. Create settlement record in 'settlements' collection
 * 3. Reset vendor walletBalance to 0
 * 4. Update vendor lastPayout timestamp
 */
export const handlePayout = async (vendorId, vendorName, amount, payoutMethod = 'bank_transfer') => {
  // Create settlement record
  const ref = await addDoc(collection(db, 'settlements'), {
    vendorId,
    vendorName,
    amount,
    date: serverTimestamp(),
    status: 'completed',
    payoutMethod,
  });

  // Reset vendor wallet and update last payout date
  await updateDoc(doc(db, 'users', vendorId), {
    walletBalance: 0,
    lastPayout: serverTimestamp(),
  });

  return ref.id;
};

// ── Payouts (legacy compat) ──
export const subscribeToPayouts = (callback) => {
  return onSnapshot(
    query(collection(db, 'payouts'), orderBy('date', 'desc')),
    (snapshot) => {
      const payouts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(payouts);
    }
  );
};

export const createPayout = async (payoutData) => {
  const ref = await addDoc(collection(db, 'payouts'), {
    ...payoutData,
    date: serverTimestamp(),
    status: 'paid',
  });
  if (payoutData.vendorId) {
    await updateDoc(doc(db, 'users', payoutData.vendorId), {
      pendingCommission: 0,
      lastPaidDate: serverTimestamp(),
    });
  }
  return ref.id;
};

// ── Helpers ──
export const getNextTuesday = () => {
  const now = new Date();
  const day = now.getDay();
  const daysUntilTuesday = (2 - day + 7) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilTuesday);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const isOverdue = (lastPaidDate) => {
  if (!lastPaidDate) return true;
  const now = new Date();
  const lastTuesday = new Date(now);
  const day = now.getDay();
  const daysSinceTuesday = (day - 2 + 7) % 7;
  lastTuesday.setDate(now.getDate() - daysSinceTuesday);
  lastTuesday.setHours(0, 0, 0, 0);
  const paidDate = lastPaidDate.toDate ? lastPaidDate.toDate() : new Date(lastPaidDate);
  return paidDate < lastTuesday;
};

export const formatTimestamp = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
};
