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
  // Listen to both sources and merge them
  let usersVendors = [];
  let legacyVendors = [];

  const unsubUsers = onSnapshot(
    query(collection(db, 'users'), where('role', '==', 'vendor')),
    (snapshot) => {
      usersVendors = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback([...usersVendors, ...legacyVendors]);
    }
  );

  const unsubLegacy = onSnapshot(collection(db, 'vendors'), (snapshot) => {
    legacyVendors = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback([...usersVendors, ...legacyVendors]);
  });

  return () => {
    unsubUsers();
    unsubLegacy();
  };
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
  // Check users first
  const unsubUsers = onSnapshot(doc(db, 'users', vendorId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      // If not in users, check vendors collection
      onSnapshot(doc(db, 'vendors', vendorId), (vSnap) => {
        if (vSnap.exists()) {
          callback({ id: vSnap.id, ...vSnap.data() });
        } else {
          callback(null);
        }
      });
    }
  });
  return unsubUsers;
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
 * Handle Manual Payout:
 * 1. Fetch vendor wallet balance
 * 2. Create settlement record in 'settlements' collection
 * 3. Reset vendor wallet balance to 0
 * 4. Update vendor lastPayoutDate
 */
export const handlePayout = async (vendorId, vendorName, amount) => {
  if (!vendorId) throw new Error('Vendor ID is required');
  
  // 1. Create settlement record
  const settlementRef = await addDoc(collection(db, 'settlements'), {
    vendorId,
    vendorName,
    amount,
    payoutDate: serverTimestamp(),
    status: 'completed',
    createdAt: serverTimestamp(),
  });

  // 2. Reset vendor wallet and update last payout date
  // We check both 'vendors' and 'users' based on the unified approach
  const vendorRef = doc(db, 'vendors', vendorId);
  const vendorSnap = await getDoc(vendorRef);
  
  if (vendorSnap.exists()) {
    await updateDoc(vendorRef, {
      walletBalance: 0,
      lastPayoutDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Fallback to 'users' if that's where the vendor is
    const userRef = doc(db, 'users', vendorId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        walletBalance: 0,
        lastPayoutDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  return settlementRef.id;
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
