import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { getDistanceFromLatLngInMeters } from '../utils/geo.js';
import { AttendanceRepository } from '../repositories/attendanceRepository.js';
import { StudentRepository } from '../repositories/studentRepository.js';
import { EventEmitter } from 'events';

export const attendanceEmitter = new EventEmitter();

export class AttendanceService {
    static async markAttendance(data) {
        const { universityRollNo, deviceFingerprint, location, name, section, classRollNo } = data;
        const today = new Date().toISOString().split('T')[0];

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const [existing, existingDevice] = await Promise.all([
                AttendanceRepository.findExistingAttendance(universityRollNo, today),
                AttendanceRepository.findExistingDevice(deviceFingerprint, today)
            ]);

            if (existing) throw new Error("You've already marked attendance today");
            if (existingDevice) throw new Error("This device has already been used to mark attendance today");

            const distance = getDistanceFromLatLngInMeters(
                location.lat, location.lng,
                env.CLASS_LAT, env.CLASS_LNG
            );

            if (distance > env.MAX_DISTANCE_METERS) {
                throw new Error(`You must be within ${env.MAX_DISTANCE_METERS} meters of the classroom to mark attendance. Current distance: ${distance.toFixed(0)}m`);
            }

            const student = await StudentRepository.upsertUser(universityRollNo, { name, section, classRollNo }, session);

            const attendanceData = {
                ...data,
                date: today,
                status: "present",
                studentId: student._id,
                distanceFromClass: distance
            };

            const attendance = await AttendanceRepository.createAttendance(attendanceData, session);

            await session.commitTransaction();
            
            attendanceEmitter.emit('new_attendance', attendance[0]);
            
            return attendance[0];
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async getAttendanceDates() {
        return AttendanceRepository.getDistinctDates();
    }

    static async getAttendanceByDate(date) {
        if (!date) throw new Error('Date parameter is required');
        return AttendanceRepository.getAttendanceByDateAndStatus(date);
    }
}
