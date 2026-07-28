"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveComplaint = exports.createComplaint = exports.getAllComplaints = exports.complaintCreateSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const error_1 = require("../middlewares/error");
// Zod schemas
exports.complaintCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        description: zod_1.z.string().min(5),
    }),
});
const getAllComplaints = async (req, res, next) => {
    try {
        const complaints = await prisma_1.default.complaint.findMany({
            include: {
                passenger: {
                    include: {
                        user: { select: { name: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            complaints,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllComplaints = getAllComplaints;
const createComplaint = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { title, description } = req.body;
        const passenger = await prisma_1.default.passenger.findFirst({
            where: { userId },
        });
        if (!passenger) {
            throw new error_1.ApiError(403, 'Only registered passenger users can submit complaints');
        }
        const complaint = await prisma_1.default.complaint.create({
            data: {
                passengerId: passenger.id,
                title,
                description,
                status: 'SUBMITTED',
            },
        });
        res.status(201).json({
            success: true,
            complaint,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createComplaint = createComplaint;
const resolveComplaint = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { resolutionDetails, status } = req.body;
        if (isNaN(id)) {
            throw new error_1.ApiError(400, 'Invalid complaint identifier');
        }
        const complaint = await prisma_1.default.complaint.findUnique({ where: { id } });
        if (!complaint) {
            throw new error_1.ApiError(404, 'Complaint ticket not found');
        }
        const updated = await prisma_1.default.complaint.update({
            where: { id },
            data: {
                status: status || 'RESOLVED',
                resolutionDetails,
            },
        });
        res.status(200).json({
            success: true,
            complaint: updated,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.resolveComplaint = resolveComplaint;
