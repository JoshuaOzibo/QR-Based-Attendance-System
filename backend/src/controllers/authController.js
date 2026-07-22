import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { env } from '../config/env.js';

const JWT_SECRET = env.JWT_SECRET || 'fallback_secret_for_development';

export const register = async (req, res) => {
    try {
        const { name, universityRollNo, password, role } = req.body;

        if (!name || !universityRollNo || !password || !role) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        if (!['STUDENT', 'LECTURER'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified' });
        }

        const existingUser = await User.findOne({ universityRollNo });
        if (existingUser && (existingUser.passwordHash || existingUser.password)) {
            return res.status(400).json({ error: 'User with this ID already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let user;
        if (existingUser) {
            existingUser.name = name || existingUser.name;
            existingUser.passwordHash = passwordHash;
            existingUser.role = role;
            user = await existingUser.save();
        } else {
            user = await User.create({
                name,
                universityRollNo,
                passwordHash,
                role,
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role, rollNo: user.universityRollNo },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                rollNo: user.universityRollNo
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { universityRollNo, password } = req.body;

        if (!universityRollNo || !password) {
            return res.status(400).json({ error: 'Please provide ID and password' });
        }

        const user = await User.findOne({ universityRollNo });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const storedHash = user.passwordHash || user.password;
        if (!storedHash) {
            return res.status(401).json({ error: 'No password set for this ID. Please sign up to create a password.' });
        }

        const isMatch = await bcrypt.compare(password, storedHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role, rollNo: user.universityRollNo },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                rollNo: user.universityRollNo
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, universityRollNo, password } = req.body;
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (name) user.name = name;
        if (universityRollNo) {
            if (universityRollNo !== user.universityRollNo) {
                const existing = await User.findOne({ universityRollNo });
                if (existing) {
                    return res.status(400).json({ error: 'ID is already taken by another user' });
                }
                user.universityRollNo = universityRollNo;
            }
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(password, salt);
        }

        await user.save();
        
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                rollNo: user.universityRollNo
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const forgotPassword = async (req, res) => {
    try {
        const { universityRollNo } = req.body;
        if (!universityRollNo) {
            return res.status(400).json({ error: 'Please provide your University ID / Roll No' });
        }
        // Always return same message to prevent user enumeration attacks
        const user = await User.findOne({ universityRollNo });
        return res.json({
            message: user
                ? `Account found for ${user.name}. Please contact your system administrator to reset your password.`
                : 'If this account exists, your administrator has been notified. Please contact them directly.',
            exists: !!user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
