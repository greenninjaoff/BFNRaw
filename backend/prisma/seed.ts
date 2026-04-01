/**
 * Seed script - creates admin user ONLY.
 * Does NOT seed products (add manually via admin panel).
 * Does NOT seed categories (add manually via admin panel).
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import db from "../src/db/db";

const ADMIN_PHONE = process.env.ADMIN_PHONE || "+998901234567";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";
const ADMIN_NAME = "Admin";

async function main() {
  console.log("Running seed...");

  // Create admin user
  const existing = await db.query(
    `SELECT id, role FROM "User" WHERE phone = $1`,
    [ADMIN_PHONE]
  );

  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
      console.log(`✓ Admin already exists: ${ADMIN_PHONE}`);
    } else {
      await db.query(
        `UPDATE "User" SET role = 'ADMIN', "updatedAt" = NOW() WHERE id = $1`,
        [user.id]
      );
      console.log(`✓ Upgraded to ADMIN: ${ADMIN_PHONE}`);
    }
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.query(
      `INSERT INTO "User" (id, phone, password, "fullName", role, "isPhoneVerified", "isBlocked", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 'ADMIN', true, false, NOW(), NOW())`,
      [ADMIN_PHONE, hashed, ADMIN_NAME]
    );
    console.log(`✓ Admin created:`);
    console.log(`  Phone:    ${ADMIN_PHONE}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => process.exit(0));
