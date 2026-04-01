import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../db/db";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const SAFE = `id, phone, "fullName", role, "isPhoneVerified", "isBlocked", "lastLoginAt", "createdAt", "updatedAt"`;

export async function register(phone: string, password: string, fullName?: string) {
  const existing = await db.query(`SELECT id FROM "User" WHERE phone = $1`, [phone]);
  if (existing.rows.length > 0) throw new Error("User already exists");
  const hashed = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO "User" (id, phone, password, "fullName", role, "isPhoneVerified", "isBlocked", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, 'USER', false, false, NOW(), NOW())
     RETURNING ${SAFE}`,
    [phone, hashed, fullName || null]
  );
  const user = result.rows[0];
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return { user, token };
}

export async function login(phone: string, password: string) {
  const result = await db.query(`SELECT * FROM "User" WHERE phone = $1`, [phone]);
  const user = result.rows[0];
  if (!user) throw new Error("Invalid credentials");
  if (user.isBlocked) throw new Error("Account is blocked");
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");
  await db.query(`UPDATE "User" SET "lastLoginAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`, [user.id]);
  const safe = await db.query(`SELECT ${SAFE} FROM "User" WHERE id = $1`, [user.id]);
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return { user: safe.rows[0], token };
}

export async function me(userId: string) {
  const result = await db.query(`SELECT ${SAFE} FROM "User" WHERE id = $1`, [userId]);
  if (!result.rows[0]) throw new Error("User not found");
  return result.rows[0];
}

export async function updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (data.fullName !== undefined) { fields.push(`"fullName" = $${idx++}`); values.push(data.fullName); }
  if (data.phone !== undefined) {
    const ex = await db.query(`SELECT id FROM "User" WHERE phone = $1 AND id != $2`, [data.phone, userId]);
    if (ex.rows.length > 0) throw new Error("Phone already in use");
    fields.push(`phone = $${idx++}`); values.push(data.phone);
  }
  if (!fields.length) throw new Error("Nothing to update");
  fields.push(`"updatedAt" = NOW()`); values.push(userId);
  const result = await db.query(
    `UPDATE "User" SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${SAFE}`, values
  );
  return result.rows[0];
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const r = await db.query(`SELECT password FROM "User" WHERE id = $1`, [userId]);
  if (!r.rows[0]) throw new Error("User not found");
  const valid = await bcrypt.compare(currentPassword, r.rows[0].password);
  if (!valid) throw new Error("Current password is incorrect");
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query(`UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2`, [hashed, userId]);
  return { success: true };
}

// Simple in-memory OTP store (replace with Redis/DB in production)
const otpStore = new Map<string, { code: string; expires: number }>();

export function generateOtp(phone: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { code, expires: Date.now() + 10 * 60 * 1000 }); // 10 min
  return code;
}

export function verifyOtp(phone: string, code: string): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expires) { otpStore.delete(phone); return false; }
  if (entry.code !== code) return false;
  otpStore.delete(phone);
  return true;
}

export async function requestPasswordReset(phone: string): Promise<string> {
  const r = await db.query(`SELECT id FROM "User" WHERE phone = $1 AND "isBlocked" = false`, [phone]);
  if (!r.rows[0]) throw new Error("No account found with this phone number");
  const code = generateOtp(phone);
  // In production: send SMS via Eskiz/SMSC/etc.
  // For now: log and return code (dev mode)
  console.log(`[DEV] OTP for ${phone}: ${code}`);
  return code; // In production don't return — just send via SMS
}

export async function resetPassword(phone: string, code: string, newPassword: string): Promise<void> {
  const valid = verifyOtp(phone, code);
  if (!valid) throw new Error("Invalid or expired verification code");
  if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
  const hashed = await bcrypt.hash(newPassword, 10);
  const r = await db.query(
    `UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE phone = $2 RETURNING id`,
    [hashed, phone]
  );
  if (!r.rows[0]) throw new Error("User not found");
}
