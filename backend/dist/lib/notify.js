"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
const db_1 = __importDefault(require("../db/db"));
async function createNotification(userId, type, title, message) {
    try {
        await db_1.default.query(`INSERT INTO "Notification" (id, "userId", type, title, message, "isRead", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW(), NOW())`, [userId, type, title, message]);
    }
    catch (e) {
        console.error("notify failed:", e);
    }
}
