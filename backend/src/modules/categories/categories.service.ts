import db from "../../db/db";

export async function getAll() {
  const r = await db.query(
    `SELECT id, name, slug, "nameRu", "nameUz", "nameEn", "isActive", "createdAt", "updatedAt"
     FROM "Category" WHERE "isActive" = true ORDER BY COALESCE("nameEn", name) ASC`
  );
  return r.rows;
}

export async function getAllForAdmin() {
  const r = await db.query(
    `SELECT id, name, slug, "nameRu", "nameUz", "nameEn", "isActive", "createdAt", "updatedAt"
     FROM "Category" ORDER BY COALESCE("nameEn", name) ASC`
  );
  return r.rows;
}

export async function create(data: {
  name?: string;
  nameRu?: string;
  nameUz?: string;
  nameEn?: string;
  slug: string;
  isActive?: boolean;
}) {
  // Use nameEn as primary name if provided, else nameRu, else name
  const primaryName = data.nameEn || data.nameRu || data.name || data.slug;
  const r = await db.query(
    `INSERT INTO "Category" (id, name, slug, "nameRu", "nameUz", "nameEn", "isActive", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
    [primaryName, data.slug, data.nameRu || null, data.nameUz || null, data.nameEn || primaryName, data.isActive ?? true]
  );
  return r.rows[0];
}

export async function update(id: string, data: any) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const key of ["name", "slug", "nameRu", "nameUz", "nameEn", "isActive"]) {
    if (data[key] !== undefined) {
      fields.push(`"${key}" = $${idx++}`);
      values.push(data[key]);
    }
  }
  if (!fields.length) throw new Error("Nothing to update");
  // Keep primary name in sync with nameEn
  if (data.nameEn && !data.name) {
    fields.push(`name = $${idx++}`);
    values.push(data.nameEn);
  }
  fields.push(`"updatedAt" = NOW()`);
  values.push(id);
  const r = await db.query(
    `UPDATE "Category" SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return r.rows[0];
}

export async function remove(id: string) {
  await db.query(`UPDATE "Category" SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1`, [id]);
  return { success: true };
}
