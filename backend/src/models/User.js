import mongoose from 'mongoose';

const usersSchema = new mongoose.Schema({
  name: String,
  universityRollNo: { type: String, unique: true },
  section: String,
  classRollNo: String,
  registeredAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', usersSchema);
export default User;
