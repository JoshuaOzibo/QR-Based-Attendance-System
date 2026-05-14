import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

const seedDatabase = async () => {
    try {
        await connectDB();
        
        console.log('Clearing existing users...');
        await User.deleteMany({});
        
        console.log('Creating test users...');
        const salt = await bcrypt.genSalt(10);
        
        // Admin / Lecturer
        const adminPasswordHash = await bcrypt.hash('admin123', salt);
        await User.create({
            name: 'Dr. Aris Thorne',
            universityRollNo: 'admin',
            passwordHash: adminPasswordHash,
            role: 'LECTURER',
        });
        
        // Student
        const studentPasswordHash = await bcrypt.hash('student123', salt);
        await User.create({
            name: 'Joshua Ozibo',
            universityRollNo: 'AIT/HND/24/00036',
            passwordHash: studentPasswordHash,
            role: 'STUDENT',
            section: 'A',
            classRollNo: '36'
        });
        
        console.log('Seeding successful!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
