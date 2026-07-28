"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.authGuard = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("./error");
const prisma_1 = __importDefault(require("../config/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'transitflow_jwt_access_secret_key_2026';
const authGuard = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_1.ApiError(401, 'Unauthorized: Access token is missing or invalid');
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (err) {
            throw new error_1.ApiError(401, 'Unauthorized: Token has expired or is tampered');
        }
        // Verify user still exists in the database and pull current role
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
            include: { role: true },
        });
        if (!user) {
            throw new error_1.ApiError(401, 'Unauthorized: The user session no longer exists');
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role.name,
        };
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.authGuard = authGuard;
// Enforces granular role-based limits
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_1.ApiError(401, 'Unauthorized: Authentication required'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new error_1.ApiError(403, 'Forbidden: You do not have permissions to perform this action'));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
