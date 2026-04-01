import db from "../../db/db";

const PRODUCT_COLS = `p.id, p.name, p.slug, p.description, p."imageUrl", p.type, p.series,
  p."isActive", p."categoryId", p."createdAt", p."updatedAt"`;

const VARIANTS_AGG = `json_agg(
  json_build_object(
    'id', f.id, 'sku', f.sku, 'flavorKey', f."flavorKey", 'flavorName', f."flavorName",
    'netWeight', f."netWeight", 'price', f.price, 'compareAtPrice', f."compareAtPrice",
    'stock', f.stock, 'imageUrl', f."imageUrl", 'costPrice', f."costPrice", 'i18n', f.i18n, 'isActive', f."isActive"
  ) ORDER BY f."createdAt"
) FILTER (WHERE f.id IS NOT NULL AND f."isActive" = true AND f."deletedAt" IS NULL) as variants`;

const VARIANTS_AGG_ALL = `json_agg(
  json_build_object(
    'id', f.id, 'sku', f.sku, 'flavorKey', f."flavorKey", 'flavorName', f."flavorName",
    'netWeight', f."netWeight", 'price', f.price, 'compareAtPrice', f."compareAtPrice",
    'stock', f.stock, 'imageUrl', f."imageUrl", 'costPrice', f."costPrice", 'i18n', f.i18n, 'isActive', f."isActive"
  ) ORDER BY f."createdAt"
) FILTER (WHERE f.id IS NOT NULL) as variants`;

export async function getAll(params: { category?: string; search?: string; isActive?: boolean }) {
  let where = `WHERE p."isActive" = true AND p."deletedAt" IS NULL`;
  const values: any[] = [];
  let idx = 1;

  if (params.category) {
    where += ` AND c.slug = $${idx++}`;
    values.push(params.category);
  }

  if (params.search) {
    where += ` AND p.name ILIKE $${idx++}`;
    values.push(`%${params.search}%`);
  }

  const r = await db.query(
    `SELECT ${PRODUCT_COLS},
            c.name as "categoryName",
            c.slug as "categorySlug",
            c."nameRu" as "categoryNameRu",
            c."nameUz" as "categoryNameUz",
            c."nameEn" as "categoryNameEn",
            ${VARIANTS_AGG}
     FROM "Product" p
     JOIN "Category" c ON c.id = p."categoryId"
     LEFT JOIN "ProductFlavor" f ON f."productId" = p.id
     ${where}
     GROUP BY p.id, c.name, c.slug, c."nameRu", c."nameUz", c."nameEn"
     ORDER BY p."createdAt" DESC`,
    values
  );

  return r.rows;
}

export async function getOne(slugOrId: string) {
  const r = await db.query(
    `SELECT ${PRODUCT_COLS},
            c.name as "categoryName",
            c.slug as "categorySlug",
            c."nameRu" as "categoryNameRu",
            c."nameUz" as "categoryNameUz",
            c."nameEn" as "categoryNameEn",
            ${VARIANTS_AGG}
     FROM "Product" p
     JOIN "Category" c ON c.id = p."categoryId"
     LEFT JOIN "ProductFlavor" f ON f."productId" = p.id
     WHERE (p.slug = $1 OR p.id = $1) AND p."isActive" = true AND p."deletedAt" IS NULL
     GROUP BY p.id, c.name, c.slug, c."nameRu", c."nameUz", c."nameEn"`,
    [slugOrId]
  );

  return r.rows[0] || null;
}

export async function getAllForAdmin(params: { category?: string; search?: string }) {
  let where = `WHERE p."deletedAt" IS NULL`;
  const values: any[] = [];
  let idx = 1;

  if (params.category) {
    where += ` AND c.slug = $${idx++}`;
    values.push(params.category);
  }

  if (params.search) {
    where += ` AND p.name ILIKE $${idx++}`;
    values.push(`%${params.search}%`);
  }

  const r = await db.query(
    `SELECT ${PRODUCT_COLS},
            c.name as "categoryName",
            c.slug as "categorySlug",
            c."nameRu" as "categoryNameRu",
            c."nameUz" as "categoryNameUz",
            c."nameEn" as "categoryNameEn",
            ${VARIANTS_AGG_ALL}
     FROM "Product" p
     JOIN "Category" c ON c.id = p."categoryId"
     LEFT JOIN "ProductFlavor" f ON f."productId" = p.id
     ${where}
     GROUP BY p.id, c.name, c.slug, c."nameRu", c."nameUz", c."nameEn"
     ORDER BY p."createdAt" DESC`,
    values
  );

  return r.rows;
}

export async function createProduct(data: any) {
  const catR = await db.query(`SELECT id FROM "Category" WHERE id = $1 OR slug = $1`, [data.categoryId]);
  if (!catR.rows[0]) throw new Error("Category not found");

  const slug = data.slug || slugify(data.name);

  const r = await db.query(
    `INSERT INTO "Product" (id, name, slug, description, "imageUrl", type, series, "isActive", "categoryId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id`,
    [
      data.name,
      slug,
      data.description || null,
      data.imageUrl || null,
      data.type || null,
      data.series || null,
      data.isActive ?? true,
      catR.rows[0].id,
    ]
  );

  return getOne(r.rows[0].id);
}

export async function updateProduct(id: string, data: any) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const allowed = ["name", "slug", "description", "imageUrl", "isActive", "categoryId", "type", "series"];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`"${key}" = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (!fields.length) throw new Error("Nothing to update");

  fields.push(`"updatedAt" = NOW()`);
  values.push(id);

  await db.query(`UPDATE "Product" SET ${fields.join(", ")} WHERE id = $${idx}`, values);

  return getOne(id) || getAllForAdmin({}).then(rows => rows.find((r: any) => r.id === id));
}

export async function softDeleteProduct(id: string) {
  await db.query(
    `UPDATE "Product" SET "deletedAt" = NOW(), "isActive" = false, "updatedAt" = NOW() WHERE id = $1`,
    [id]
  );

  return { success: true };
}

export async function createFlavor(productId: string, data: any) {
  const r = await db.query(
    `INSERT INTO "ProductFlavor"
       (id, sku, "flavorKey", "flavorName", "netWeight", price, "compareAtPrice",
        "costPrice", stock, "imageUrl", i18n, "isActive", "productId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
     RETURNING *`,
    [
      data.sku,
      data.flavorKey || "",
      data.flavorName || null,
      data.netWeight || null,
      data.price,
      data.compareAtPrice || null,
      data.costPrice ?? 0,
      data.stock ?? 0,
      data.imageUrl || null,
      data.i18n ? JSON.stringify(data.i18n) : null,
      data.isActive ?? true,
      productId,
    ]
  );

  return r.rows[0];
}

export async function updateFlavor(id: string, data: any) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const allowed = [
    "sku",
    "flavorKey",
    "flavorName",
    "netWeight",
    "price",
    "compareAtPrice",
    "costPrice",
    "stock",
    "imageUrl",
    "i18n",
    "isActive",
  ];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`"${key}" = $${idx++}`);
      values.push(key === "i18n" ? JSON.stringify(data[key]) : data[key]);
    }
  }

  if (!fields.length) throw new Error("Nothing to update");

  fields.push(`"updatedAt" = NOW()`);
  values.push(id);

  const r = await db.query(
    `UPDATE "ProductFlavor" SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );

  return r.rows[0];
}

export async function deleteFlavor(id: string) {
  await db.query(
    `UPDATE "ProductFlavor" SET "deletedAt" = NOW(), "isActive" = false, "updatedAt" = NOW() WHERE id = $1`,
    [id]
  );

  return { success: true };
}

function slugify(name: string) {
  return name.toLowerCase().trim()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}