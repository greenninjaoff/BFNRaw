"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
exports.generateOtp = generateOtp;
exports.verifyOtp = verifyOtp;
exports.requestPasswordReset = requestPasswordReset;
exports.resetPassword = resetPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../../db/db"));
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const SAFE = `id, phone, "fullName", role, "isPhoneVerified", "isBlocked", "lastLoginAt", "createdAt", "updatedAt"`;
async function register(phone, password, fullName) {
    const existing = await db_1.default.query(`SELECT id FROM "User" WHERE phone = $1`, [phone]);
    if (existing.rows.length > 0)
        throw new Error("User already exists");
    const hashed = await bcrypt_1.default.hash(password, 10);
    const result = await db_1.default.query(`INSERT INTO "User" (id, phone, password, "fullName", role, "isPhoneVerified", "isBlocked", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, 'USER', false, false, NOW(), NOW())
     RETURNING ${SAFE}`, [phone, hashed, fullName || null]);
    const user = result.rows[0];
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return { user, token };
}
async function login(phone, password) {
    const result = await db_1.default.query(`SELECT * FROM "User" WHERE phone = $1`, [phone]);
    const user = result.rows[0];
    if (!user)
        throw new Error("Invalid credentials");
    if (user.isBlocked)
        throw new Error("Account is blocked");
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid)
        throw new Error("Invalid credentials");
    await db_1.default.query(`UPDATE "User" SET "lastLoginAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`, [user.id]);
    const safe = await db_1.default.query(`SELECT ${SAFE} FROM "User" WHERE id = $1`, [user.id]);
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return { user: safe.rows[0], token };
}
async function me(userId) {
    const result = await db_1.default.query(`SELECT ${SAFE} FROM "User" WHERE id = $1`, [userId]);
    if (!result.rows[0])
        throw new Error("User not found");
    return result.rows[0];
}
async function updateProfile(userId, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    if (data.fullName !== undefined) {
        fields.push(`"fullName" = $${idx++}`);
        values.push(data.fullName);
    }
    if (data.phone !== undefined) {
        const ex = await db_1.default.query(`SELECT id FROM "User" WHERE phone = $1 AND id != $2`, [data.phone, userId]);
        if (ex.rows.length > 0)
            throw new Error("Phone already in use");
        fields.push(`phone = $${idx++}`);
        values.push(data.phone);
    }
    if (!fields.length)
        throw new Error("Nothing to update");
    fields.push(`"updatedAt" = NOW()`);
    values.push(userId);
    const result = await db_1.default.query(`UPDATE "User" SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${SAFE}`, values);
    return result.rows[0];
}
async function changePassword(userId, currentPassword, newPassword) {
    const r = await db_1.default.query(`SELECT password FROM "User" WHERE id = $1`, [userId]);
    if (!r.rows[0])
        throw new Error("User not found");
    const valid = await bcrypt_1.default.compare(currentPassword, r.rows[0].password);
    if (!valid)
        throw new Error("Current password is incorrect");
    const hashed = await bcrypt_1.default.hash(newPassword, 10);
    await db_1.default.query(`UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2`, [hashed, userId]);
    return { success: true };
}
// Simple in-memory OTP store (replace with Redis/DB in production)
const otpStore = new Map();
function generateOtp(phone) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { code, expires: Date.now() + 10 * 60 * 1000 }); // 10 min
    return code;
}
function verifyOtp(phone, code) {
    const entry = otpStore.get(phone);
    if (!entry)
        return false;
    if (Date.now() > entry.expires) {
        otpStore.delete(phone);
        return false;
    }
    if (entry.code !== code)
        return false;
    otpStore.delete(phone);
    return true;
}
async function requestPasswordReset(phone) {
    const r = await db_1.default.query(`SELECT id FROM "User" WHERE phone = $1 AND "isBlocked" = false`, [phone]);
    if (!r.rows[0])
        throw new Error("No account found with this phone number");
    const code = generateOtp(phone);
    // In production: send SMS via Eskiz/SMSC/etc.
    // For now: log and return code (dev mode)
    console.log(`[DEV] OTP for ${phone}: ${code}`);
    return code; // In production don't return — just send via SMS
}
async function resetPassword(phone, code, newPassword) {
    const valid = verifyOtp(phone, code);
    if (!valid)
        throw new Error("Invalid or expired verification code");
    if (newPassword.length < 6)
        throw new Error("Password must be at least 6 characters");
    const hashed = await bcrypt_1.default.hash(newPassword, 10);
    const r = await db_1.default.query(`UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE phone = $2 RETURNING id`, [hashed, phone]);
    if (!r.rows[0])
        throw new Error("User not found");
}
