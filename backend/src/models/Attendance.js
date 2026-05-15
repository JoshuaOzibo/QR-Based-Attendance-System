import mongoose from 'mongoose';

const attendancesSchema = new mongoose.Schema({
  name: { type: String, required: true },
  universityRollNo: { type: String, required: true },
  section: { type: String, default: "N/A" },
  classRollNo: { type: String, default: "N/A" },
  date: { type: String, required: true },
  time: {
    type: String,
    default: () => new Date().toLocaleTimeString('en-IN', { hour12: false })
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  deviceFingerprint: { type: String, required: true },
  status: { type: String, default: "present" },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true }
}, {
  timestamps: true
});

// Create indexes
attendancesSchema.index({ universityRollNo: 1, sessionId: 1 });
attendancesSchema.index({ deviceFingerprint: 1, sessionId: 1 });

const Attendance = mongoose.model('Attendance', attendancesSchema);
export default Attendance;
