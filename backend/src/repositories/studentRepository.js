import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';

export class StudentRepository {
    static async findProfileByRollNo(rollNo) {
        return StudentProfile.findOne({ universityRollNo: rollNo });
    }

    static async findAllStudents() {
        return StudentProfile.find().select('universityRollNo name section').lean();
    }

    static async upsertUser(rollNo, data, session) {
        return User.findOneAndUpdate(
            { universityRollNo: rollNo },
            { $setOnInsert: data },
            { new: true, upsert: true, session }
        );
    }

    static async getStudentsByAttendanceRange(minPercentage, maxPercentage, totalClasses) {
        const results = await StudentProfile.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "universityRollNo",
                    foreignField: "universityRollNo",
                    as: "user"
                }
            },
            {
                $lookup: {
                    from: "attendances",
                    let: { rollNo: "$universityRollNo" },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { 
                                    $and: [
                                        { $eq: ["$universityRollNo", "$$rollNo"] },
                                        { $eq: ["$status", "present"] }
                                    ]
                                }
                            }
                        },
                        { $count: "presentDays" }
                    ],
                    as: "attendance"
                }
            },
            {
                $addFields: {
                    presentDays: { $ifNull: [{ $arrayElemAt: ["$attendance.presentDays", 0] }, 0] },
                    totalClasses: totalClasses,
                    attendancePercentage: {
                        $round: [
                            { 
                                $multiply: [
                                    { 
                                        $divide: [
                                            { $ifNull: [{ $arrayElemAt: ["$attendance.presentDays", 0] }, 0] },
                                            totalClasses
                                        ] 
                                    },
                                    100
                                ] 
                            }
                        ]
                    },
                    name: {
                        $ifNull: [
                            { $arrayElemAt: ["$user.name", 0] },
                            { $arrayElemAt: ["$user.personalInfo.fullName", 0] },
                            "N/A"
                        ]
                    },
                    section: {
                        $ifNull: [
                            { $arrayElemAt: ["$user.section", 0] },
                            { $arrayElemAt: ["$user.academicInfo.section", 0] },
                            "N/A"
                        ]
                    }
                }
            },
            {
                $match: {
                    attendancePercentage: { $gte: minPercentage, $lte: maxPercentage }
                }
            },
            {
                $sort: { attendancePercentage: -1 }
            },
            {
                $project: {
                    universityRollNo: 1,
                    name: 1,
                    section: 1,
                    attendancePercentage: 1,
                    presentDays: 1,
                    totalClasses: 1,
                    _id: 0
                }
            }
        ]);
        return results;
    }
}
