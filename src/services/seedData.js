import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const seedDummyData = async () => {
  try {
    // Seed Vendors
    const vendors = [
      { name: 'John Doe', businessName: 'JD Plumbing', phone: '+1234567890', status: 'approved', location: { city: 'Mumbai' }, category: 'Plumbing', createdAt: serverTimestamp() },
      { name: 'Jane Smith', businessName: 'Elite Cleaning', phone: '+1987654321', status: 'pending', location: { city: 'Delhi' }, category: 'Cleaning', createdAt: serverTimestamp() },
    ];

    for (const v of vendors) {
      await addDoc(collection(db, 'vendors'), v);
    }

    // Seed Bookings
    const bookings = [
      { customerName: 'Alice Blue', vendorName: 'JD Plumbing', serviceName: 'Pipe Repair', amount: 1500, status: 'completed', createdAt: serverTimestamp() },
      { customerName: 'Bob Green', vendorName: 'Elite Cleaning', serviceName: 'House Deep Clean', amount: 3500, status: 'pending', createdAt: serverTimestamp() },
    ];

    for (const b of bookings) {
      await addDoc(collection(db, 'bookings'), b);
    }

    console.log("Dummy data seeded successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};
