import db from "../db/db";

export type NotifType = "INFO" | "ORDER" | "PROMO" | "SYSTEM";

export async function createNotification(
  userId: string, type: NotifType, title: string, message: string
) {
  try {
    await db.query(
      `INSERT INTO "Notification" (id, "userId", type, title, message, "isRead", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW(), NOW())`,
      [userId, type, title, message]
    );
  } catch (e) { console.error("notify failed:", e); }
}
