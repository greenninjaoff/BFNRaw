import db from "../../db/db";

export async function getByUser(userId: string) {
  const r = await db.query(
    `SELECT * FROM "Address" WHERE "userId" = $1 ORDER BY "isDefault" DESC, "createdAt" ASC`,
    [userId]
  );
  return r.rows;
}

export async function create(userId: string, data: any) {
  // If this is set as default, unset others first
  if (data.isDefault) {
    await db.query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
  }
  const r = await db.query(
    `INSERT INTO "Address" (id, "userId", title, "fullName", phone, city, district, street, house, apartment, landmark, "deliveryInstructions", lat, lng, "isDefault", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
     RETURNING *`,
    [
      userId, data.title || null, data.fullName || null, data.phone || null,
      data.city || null, data.district || null, data.street || null, data.house || null,
      data.apartment || null, data.landmark || null, data.deliveryInstructions || null,
      data.lat || null, data.lng || null, data.isDefault ?? false,
    ]
  );
  return r.rows[0];
}

export async function update(id: string, userId: string, data: any) {
  // Verify ownership
  const own = await db.query(`SELECT id FROM "Address" WHERE id = $1 AND "userId" = $2`, [id, userId]);
  if (!own.rows[0]) throw new Error("Address not found");
  if (data.isDefault) {
    await db.query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
  }
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  const allowed = ["title","fullName","phone","city","district","street","house","apartment","landmark","deliveryInstructions","lat","lng","isDefault"];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`"${key}" = $${idx++}`);
      values.push(data[key]);
    }
  }
  if (!fields.length) throw new Error("Nothing to update");
  fields.push(`"updatedAt" = NOW()`);
  values.push(id);
  const r = await db.query(
    `UPDATE "Address" SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values
  );
  return r.rows[0];
}

export async function remove(id: string, userId: string) {
  const own = await db.query(`SELECT id FROM "Address" WHERE id = $1 AND "userId" = $2`, [id, userId]);
  if (!own.rows[0]) throw new Error("Address not found");
  await db.query(`DELETE FROM "Address" WHERE id = $1`, [id]);
  return { success: true };
}

export async function setDefault(id: string, userId: string) {
  const own = await db.query(`SELECT id FROM "Address" WHERE id = $1 AND "userId" = $2`, [id, userId]);
  if (!own.rows[0]) throw new Error("Address not found");
  await db.query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
  const r = await db.query(
    `UPDATE "Address" SET "isDefault" = true, "updatedAt" = NOW() WHERE id = $1 RETURNING *`, [id]
  );
  return r.rows[0];
}
