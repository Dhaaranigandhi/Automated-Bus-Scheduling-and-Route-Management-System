"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSetting = exports.getSettings = exports.settingUpdateSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
// Zod schemas
exports.settingUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        key: zod_1.z.string().min(1),
        value: zod_1.z.string().min(1),
    }),
});
const getSettings = async (req, res, next) => {
    try {
        const settings = await prisma_1.default.setting.findMany();
        res.status(200).json({
            success: true,
            settings,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getSettings = getSettings;
const updateSetting = async (req, res, next) => {
    try {
        const { key, value } = req.body;
        const setting = await prisma_1.default.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
        res.status(200).json({
            success: true,
            setting,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateSetting = updateSetting;
