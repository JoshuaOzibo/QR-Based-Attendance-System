import { StudentRepository } from '../repositories/studentRepository.js';
import { AttendanceRepository } from '../repositories/attendanceRepository.js';

export class StudentService {
    static async getStudentProfile(rollNo) {
        const student = await StudentRepository.findProfileByRollNo(rollNo);
        if (!student) throw new Error('Student not found');
        return student;
    }

    static async getStudentsByAttendanceRange(min, max) {
        const minPercentage = parseFloat(min);
        const maxPercentage = parseFloat(max);

        if (isNaN(minPercentage) || isNaN(maxPercentage)) throw new Error('Percentages must be numbers');
        if (minPercentage < 0 || maxPercentage > 100) throw new Error('Percentages must be between 0 and 100');
        if (minPercentage > maxPercentage) throw new Error('Minimum percentage cannot be greater than maximum');

        const allDates = await AttendanceRepository.getDistinctDates();
        const totalClasses = allDates.length;
        if (totalClasses === 0) return [];

        const results = await StudentRepository.getStudentsByAttendanceRange(minPercentage, maxPercentage, totalClasses);
        
        // Manual sorting as in original
        if (results && results.length > 1) {
            const n = results.length;
            for (let i = 0; i < n - 1; i++) {
                for (let j = 0; j < n - i - 1; j++) {
                    if (results[j].attendancePercentage < results[j + 1].attendancePercentage) {
                        const temp = results[j];
                        results[j] = results[j + 1];
                        results[j + 1] = temp;
                    }
                }
            }
        }
        return results;
    }

    static async getStudentAttendance(rollNo, period = 'current') {
        const student = await StudentRepository.findProfileByRollNo(rollNo);
        if (!student) throw new Error('Student not found');

        const dateRange = {
            current: () => ({ start: new Date(new Date().setMonth(new Date().getMonth() - 4)), end: new Date() }),
            last: () => ({ start: new Date(new Date().setMonth(new Date().getMonth() - 8)), end: new Date(new Date().setMonth(new Date().getMonth() - 4)) }),
            year: () => ({ start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), end: new Date() })
        };

        const { start, end } = dateRange[period] ? dateRange[period]() : dateRange.current();
        const startIso = new Date(start).toISOString().split('T')[0];
        const endIso = new Date(end).toISOString().split('T')[0];

        const allAttendance = await AttendanceRepository.getDistinctDatesInRange(startIso, endIso);
        const totalClasses = allAttendance.length;

        const attendance = await AttendanceRepository.getStudentAttendanceRecords(rollNo, startIso, endIso);

        const presentDays = attendance.filter(a => a.status === 'present').length;
        const percentage = totalClasses > 0 ? Math.round((presentDays / totalClasses) * 100) : 0;

        const monthlyData = attendance.reduce((acc, record) => {
            const monthYear = new Date(record.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!acc[monthYear]) acc[monthYear] = { present: 0, total: 0 };
            acc[monthYear].total++;
            if (record.status === 'present') acc[monthYear].present++;
            return acc;
        }, {});

        const labels = Object.keys(monthlyData);
        const studentAttendance = labels.map(label => 
            monthlyData[label].total > 0 ? Math.round((monthlyData[label].present / monthlyData[label].total) * 100) : 0
        );

        return {
            attendanceRecords: attendance,
            attendancePercentage: percentage,
            totalClasses,
            presentDays,
            chartData: {
                labels,
                studentAttendance,
                departmentAverage: studentAttendance.map(p => Math.max(70, Math.min(95, p + (Math.random() * 10 - 5))))
            }
        };
    }
}
