import mongoose from 'mongoose';
import { env } from './env.js';
import Attendance from '../models/Attendance.js';
import StudentProfile from '../models/StudentProfile.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB");

    try {
      await Attendance.createIndexes([
        { key: { universityRollNo: 1, date: 1 }, name: "student_date_attendance_idx" },
        { key: { deviceFingerprint: 1, date: 1 }, name: "device_date_attendance_idx" }
      ]);
      await StudentProfile.createIndexes([
        { key: { universityRollNo: 1 }, name: "student_rollno_profile_idx", unique: true }
      ]);
      console.log("Indexes ensured/created for Attendance and StudentProfile.");
    } catch (err) {
      console.error("Index creation/ensuring error:", err);
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
