import mongoose from 'mongoose';

const usersSchema = new mongoose.Schema({
  name: String,
  universityRollNo: { type: String, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['STUDENT', 'LECTURER'], default: 'STUDENT' },
  email: { type: String, sparse: true },
  section: String,
  classRollNo: String,
  registeredAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', usersSchema);
export default User;
