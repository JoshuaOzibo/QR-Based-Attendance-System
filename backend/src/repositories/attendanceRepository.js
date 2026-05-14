import Attendance from '../models/Attendance.js';

export class AttendanceRepository {
    static async getDistinctDates() {
        return Attendance.find().distinct('date');
    }

    static async getAttendanceByDateAndStatus(date, status = 'present') {
        return Attendance.find({ date, status }).sort({ universityRollNo: 1 });
    }

    static async countAttendanceByDate(date) {
        return Attendance.countDocuments({ date, status: 'present' });
    }

    static async countFlaggedAttendance(date) {
        return Attendance.countDocuments({ date, status: 'flagged' });
    }

    static async findExistingAttendance(universityRollNo, date) {
        return Attendance.findOne({ universityRollNo, date });
    }

    static async findExistingDevice(deviceFingerprint, date) {
        return Attendance.findOne({ deviceFingerprint, date });
    }

    static async createAttendance(data, session) {
        return Attendance.create([data], { session });
    }

    static async getStudentAttendanceRecords(rollNo, start, end) {
        return Attendance.find({
            universityRollNo: rollNo,
            date: {
                $gte: start,
                $lte: end
            }
        }).sort({ date: 1 });
    }

    static async getDistinctDatesInRange(start, end) {
        return Attendance.find({
            date: {
                $gte: start,
                $lte: end
            }
        }).distinct('date');
    }
}
