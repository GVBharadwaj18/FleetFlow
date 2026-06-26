import Invoice from '../models/Invoice.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Part from '../models/Part.js';
import mongoose from 'mongoose';

// GET /api/reports/revenue
export const getMonthlyRevenue = async (req, res) => {
    try {
        const revenue = await Invoice.aggregate([
            {
                $group: {
                    _id: { 
                        year: { $year: "$date" }, 
                        month: { $month: "$date" } 
                    },
                    totalRevenue: { $sum: "$total" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const formatted = revenue.map(r => ({
            name: `${r._id.year}-${r._id.month.toString().padStart(2, '0')}`,
            revenue: r.totalRevenue
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching revenue report', error: err.message });
    }
};

// GET /api/reports/maintenance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export const getMaintenanceCount = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchStage = {};

        if (startDate && endDate) {
            matchStage = {
                serviceDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const count = await MaintenanceRecord.countDocuments(matchStage);
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching maintenance count', error: err.message });
    }
};

// GET /api/reports/parts
export const getMostUsedParts = async (req, res) => {
    try {
        const parts = await MaintenanceRecord.aggregate([
            { $unwind: "$partsUsed" },
            {
                $group: {
                    _id: "$partsUsed",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "parts",
                    localField: "_id",
                    foreignField: "_id",
                    as: "partDetails"
                }
            },
            { $unwind: "$partDetails" },
            {
                $project: {
                    _id: 0,
                    partId: "$_id",
                    name: "$partDetails.name",
                    count: 1
                }
            }
        ]);

        res.json(parts);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching most used parts', error: err.message });
    }
};
