"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../db/db"));
const ADMIN_PHONE = process.env.ADMIN_PHONE || "+998901234567";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123456";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
async function createAdmin() {
    console.log("Creating admin user...");
    const existing = await db_1.default.query(`SELECT id, role FROM "User" WHERE phone = $1`, [ADMIN_PHONE]);
    if (existing.rows.length > 0) {
        const user = existing.rows[0];
        if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
            console.log(`✓ Admin already exists with phone ${ADMIN_PHONE}`);
            return;
        }
        await db_1.default.query(`UPDATE "User" SET role = 'ADMIN', "updatedAt" = NOW() WHERE id = $1`, [user.id]);
        console.log(`✓ Upgraded existing user ${ADMIN_PHONE} to ADMIN`);
        return;
    }
    const hashed = await bcrypt_1.default.hash(ADMIN_PASSWORD, 10);
    await db_1.default.query(`INSERT INTO "User" (id, phone, password, "fullName", role, "isPhoneVerified", "isBlocked", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, 'ADMIN', true, false, NOW(), NOW())`, [ADMIN_PHONE, hashed, ADMIN_NAME]);
    console.log(`✓ Admin created:`);
    console.log(`  Phone:    ${ADMIN_PHONE}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
}
createAdmin()
    .catch((e) => { console.error("Failed:", e.message); process.exit(1); })
    .finally(() => process.exit(0));
