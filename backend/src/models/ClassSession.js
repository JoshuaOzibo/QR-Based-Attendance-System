import mongoose from 'mongoose';

const classSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  courseTitle: { type: String, required: true },
  hall: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  lecturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lecturerName: { type: String },
  qrImageUrl: { type: String },
  cloudinaryPublicId: { type: String },
  status: { type: String, enum: ['active', 'ended'], default: 'active' }
}, {
  timestamps: true
});

classSessionSchema.index({ lecturerId: 1 });
classSessionSchema.index({ date: 1 });

const ClassSession = mongoose.model('ClassSession', classSessionSchema);
export default ClassSession;
