import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";

// Using the config from the project
const firebaseConfig = {
  apiKey: "AIzaSyADuarw2vDVZo6-zgOqb9n--Z534V3wU4E",
  authDomain: "jayple-app-2026.firebaseapp.com",
  projectId: "jayple-app-2026",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Starting seed...");

  // 1. Create Admin User (for login verification)
  // Note: This won't create the Auth account, but it will allow the dashboard to pass the role check
  await setDoc(doc(db, "users", "admin123"), {
    name: "System Admin",
    email: "admin@jayple.com",
    role: "admin",
    status: "active"
  });

  // 2. Create sample vendors
  const vendors = [
    {
      id: "v1",
      name: "John's Services",
      businessName: "John Plumbing Co.",
      phone: "+91 9876543210",
      email: "john@plumbing.com",
      city: "Mumbai",
      status: "approved",
      walletBalance: 12500,
      totalEarnings: 85000,
      commission: 8500,
      createdAt: Timestamp.now()
    },
    {
      id: "v2",
      name: "Priya Malik",
      businessName: "Sparkle Cleaning",
      phone: "+91 9876543211",
      email: "priya@sparkle.com",
      city: "Delhi",
      status: "approved",
      walletBalance: 4500,
      totalEarnings: 32000,
      commission: 3200,
      createdAt: Timestamp.now()
    },
    {
      id: "v3",
      name: "Rahul Sharma",
      businessName: "FixIt Electricals",
      phone: "+91 9876543212",
      email: "rahul@fixit.com",
      city: "Bangalore",
      status: "pending",
      walletBalance: 0,
      totalEarnings: 0,
      commission: 0,
      createdAt: Timestamp.now()
    }
  ];

  for (const v of vendors) {
    await setDoc(doc(db, "vendors", v.id), v);
  }

  // 3. Create sample bookings (for dashboard and detail charts)
  const bookings = [
    {
      vendorId: "v1",
      vendorName: "John's Services",
      customerName: "Alice Smith",
      service: "Tap Repair",
      amount: 1500,
      status: "completed",
      createdAt: Timestamp.now()
    },
    {
      vendorId: "v1",
      vendorName: "John's Services",
      customerName: "Bob Brown",
      service: "Pipe Leakage",
      amount: 4500,
      status: "completed",
      createdAt: Timestamp.now()
    },
    {
      vendorId: "v2",
      vendorName: "Priya Malik",
      customerName: "Charlie Day",
      service: "Home Cleaning",
      amount: 3200,
      status: "completed",
      createdAt: Timestamp.now()
    }
  ];

  for (const b of bookings) {
    const bRef = await addDoc(collection(db, "bookings"), b);
    // Also create matching transactions
    await addDoc(collection(db, "transactions"), {
      ...b,
      bookingId: bRef.id,
      vendorEarnings: b.amount * 0.9,
      commission: b.amount * 0.1
    });
  }

  console.log("Seed completed successfully!");
}

seed().catch(console.error);
