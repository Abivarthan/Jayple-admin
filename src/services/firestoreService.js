import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  writeBatch,
  increment,
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

const normalizeVendor = (data) => {
  if (!data) return null;
  return {
    ...data,
    name: data.ownerName || data.owner || data.name || data.displayName || data.fullName || data.vendorName || '—',
    storeName: data.shopName || data.storeName || data.businessName || data.companyName || data.firmName || data.brandName || data.name || '—',
    email: data.email || data.emailId || data.mail || '—',
    phone: data.phone || data.phoneNumber || data.contactNumber || data.mobileNumber || data.mobile || data.contact || '—',
    createdAt: data.createdAt || data.joiningDate || data.dateJoined || data.registrationDate || data.joinedAt || data.timestamp || null,
    city: data.city || data.address || data.city_name || data.location_name || (typeof data.location === 'string' ? data.location : null),
  };
};

export const subscribeToVendorById = (vendorId, callback) => {
  // Check users first
  const unsubUsers = onSnapshot(doc(db, 'users', vendorId), (snap) => {
    if (snap.exists()) {
      callback(normalizeVendor({ id: snap.id, ...snap.data() }));
    } else {
      // If not in users, check vendors collection
      onSnapshot(doc(db, 'vendors', vendorId), (vSnap) => {
        if (vSnap.exists()) {
          callback(normalizeVendor({ id: vSnap.id, ...vSnap.data() }));
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

// ── Notifications ──
export const subscribeToNotifications = (callback, vendorId = null) => {
  let q = query(
    collection(db, 'notifications'), 
    orderBy('createdAt', 'desc'), 
    limit(50)
  );
  if (vendorId) {
    q = query(
      collection(db, 'notifications'), 
      where('vendorId', '==', vendorId), 
      orderBy('createdAt', 'desc'), 
      limit(50)
    );
  }
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const createNotification = async (notif) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...notif,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const markNotificationAsRead = async (notificationId) => {
  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, { isRead: true });
};

// Logic to check and create "Payout Due" notifications
export const checkVendorPayoutDue = async () => {
  const vendorsSnap = await getDocs(collection(db, 'vendors'));
  const today = new Date();
  
  for (const vDoc of vendorsSnap.docs) {
    const v = vDoc.data();
    if (v.walletBalance > 0 && v.payoutDueDate) {
      const dueDate = v.payoutDueDate?.toDate ? v.payoutDueDate.toDate() : new Date(v.payoutDueDate);
      if (today >= dueDate) {
        // Create notification
        await createNotification({
          vendorId: vDoc.id,
          title: 'Payout Due',
          message: 'Your payout is due. Please contact admin for settlement.',
          type: 'payout_due',
        });
      }
    }
  }
};

/**
 * Handle Manual Payout (Platform pays Vendor):
 * 1. Create settlement record (type: 'payout')
 * 2. Reset vendor walletBalance to zero
 * 3. Send notification
 */
export const handlePayout = async (vendorId, vendorName, amount) => {
  if (!vendorId) throw new Error('Vendor ID is required');
  const numericAmount = Number(amount || 0);
  console.log(`[Payout] Processing for ${vendorName} (${vendorId}) amount: ${numericAmount}`);
  
  const vendorRef = doc(db, 'vendors', vendorId);
  const userRef = doc(db, 'users', vendorId);
  
  const [vSnap, uSnap] = await Promise.all([getDoc(vendorRef), getDoc(userRef)]);
  
  const batch = writeBatch(db);
  const settlementRef = doc(collection(db, 'settlements'));

  // 1. Create settlement record
  batch.set(settlementRef, {
    vendorId,
    vendorName,
    amount: numericAmount,
    type: 'payout',
    date: serverTimestamp(),
    status: 'completed',
    createdAt: serverTimestamp(),
    method: 'Bank Transfer'
  });

  // 2. Update vendor/user records
  const updateData = {
    walletBalance: 0,
    lastPayoutDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (vSnap.exists()) batch.update(vendorRef, updateData);
  if (uSnap.exists()) batch.update(userRef, updateData);

  // 3. Create Notification
  const notifRef = doc(collection(db, 'notifications'));
  batch.set(notifRef, {
    vendorId,
    title: 'Payout Completed',
    message: `Your payout of ₹${amount.toLocaleString()} has been processed by admin.`,
    type: 'payout_completed',
    isRead: false,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return settlementRef.id;
};

/**
 * Handle Commission Collection (Vendor pays Platform):
 * 1. Create settlement record (type: 'commission')
 * 2. Reset vendorDue to zero
 * 3. Send notification
 */
export const handleCollectCommission = async (vendorId, vendorName, amount) => {
  if (!vendorId) throw new Error('Vendor ID is required');
  const numericAmount = Number(amount || 0);
  console.log(`[Collect] Processing for ${vendorName} (${vendorId}) amount: ${numericAmount}`);
  
  const vendorRef = doc(db, 'vendors', vendorId);
  const userRef = doc(db, 'users', vendorId);
  
  const [vSnap, uSnap] = await Promise.all([getDoc(vendorRef), getDoc(userRef)]);
  
  const batch = writeBatch(db);
  const settlementRef = doc(collection(db, 'settlements'));

  // 1. Create settlement record
  batch.set(settlementRef, {
    vendorId,
    vendorName,
    amount: numericAmount,
    type: 'commission',
    date: serverTimestamp(),
    status: 'completed',
    createdAt: serverTimestamp(),
    method: 'Cash/Offline'
  });

  // 2. Update vendor/user records
  const updateData = {
    vendorDue: 0,
    totalCommission: increment(numericAmount),
    updatedAt: serverTimestamp(),
  };

  if (vSnap.exists()) batch.update(vendorRef, updateData);
  if (uSnap.exists()) batch.update(userRef, updateData);

  // 3. Create Notification
  const notifRef = doc(collection(db, 'notifications'));
  batch.set(notifRef, {
    vendorId,
    title: 'Commission Collected',
    message: `Commission of ₹${amount.toLocaleString()} has been collected/settled.`,
    type: 'commission_settled',
    isRead: false,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
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

export const formatLocation = (loc) => {
  if (!loc) return '—';
  if (typeof loc === 'string') return loc;
  if (loc.city) return loc.city;
  if (loc.address) return loc.address;
  if (loc.name) return loc.name;
  const lat = loc.latitude !== undefined ? loc.latitude : loc._lat;
  const lng = loc.longitude !== undefined ? loc.longitude : loc._long;
  if (lat !== undefined && lng !== undefined) return 'Map Location'; 
  if (typeof loc === 'object') return 'Location Data';
  return '—';
};

// ── Delete Vendor ──
export const deleteVendor = async (vendorId) => {
  if (!vendorId) throw new Error('Vendor ID is required');
  await deleteDoc(doc(db, 'users', vendorId));
  await deleteDoc(doc(db, 'vendors', vendorId));
  const collectionsToDelete = ['bookings', 'transactions', 'settlements', 'payouts', 'notifications'];
  const deletePromises = [];
  for (const colName of collectionsToDelete) {
    const q = query(collection(db, colName), where('vendorId', '==', vendorId));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      deletePromises.push(deleteDoc(d.ref));
    });
  }
  await Promise.all(deletePromises);
};
