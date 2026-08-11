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

        const allRecordsInRange = await AttendanceRepository.getAllAttendanceRecordsInRange(startIso, endIso);
        const deptMonthlyData = allRecordsInRange.reduce((acc, record) => {
            const monthYear = new Date(record.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!acc[monthYear]) acc[monthYear] = { present: 0, total: 0 };
            acc[monthYear].total++;
            if (record.status === 'present') acc[monthYear].present++;
            return acc;
        }, {});
        const departmentAverage = labels.map(label =>
            deptMonthlyData[label] && deptMonthlyData[label].total > 0
                ? Math.round((deptMonthlyData[label].present / deptMonthlyData[label].total) * 100)
                : 0
        );

        const classDateSet = new Set(allAttendance);
        const presentDateSet = new Set(attendance.filter(a => a.status === 'present').map(a => a.date));
        const sortedClassDates = [...allAttendance].sort();

        let bestStreak = 0;
        let runStreak = 0;
        for (const date of sortedClassDates) {
            if (presentDateSet.has(date)) {
                runStreak++;
                bestStreak = Math.max(bestStreak, runStreak);
            } else {
                runStreak = 0;
            }
        }

        let currentStreak = 0;
        for (let i = sortedClassDates.length - 1; i >= 0; i--) {
            if (presentDateSet.has(sortedClassDates[i])) currentStreak++;
            else break;
        }

        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        const mondayIso = monday.toISOString().split('T')[0];
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const sundayIso = sunday.toISOString().split('T')[0];

        const weekClassDates = sortedClassDates.filter(date => date >= mondayIso && date <= sundayIso);
        const weeklyTotal = weekClassDates.length;
        const weeklyPresent = weekClassDates.filter(date => presentDateSet.has(date)).length;
        const weeklyPercentage = weeklyTotal > 0 ? Math.round((weeklyPresent / weeklyTotal) * 100) : 0;

        const heatmap = [];
        for (let i = 59; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            let status = 'none';
            if (presentDateSet.has(iso)) status = 'present';
            else if (classDateSet.has(iso)) status = 'absent';
            heatmap.push({ date: iso, status });
        }

        return {
            attendanceRecords: attendance,
            attendancePercentage: percentage,
            totalClasses,
            presentDays,
            weeklyStats: {
                present: weeklyPresent,
                total: weeklyTotal,
                percentage: weeklyPercentage
            },
            streak: {
                current: currentStreak,
                best: bestStreak
            },
            heatmap,
            chartData: {
                labels,
                studentAttendance,
                departmentAverage
            }
        };
    }
}
