import db from "../../db/db";

async function getSetting(key: string, fallback: number): Promise<number> {
  try {
    const r = await db.query(`SELECT value FROM "AppSetting" WHERE key = $1`, [key]);
    return r.rows[0] ? Number(r.rows[0].value) : fallback;
  } catch { return fallback; }
}

const PRODUCT_QUERY = `
  SELECT p.*, c.name as "categoryName", c.slug as "categorySlug",
    json_agg(json_build_object(
      'id', f.id, 'sku', f.sku, 'flavorKey', f."flavorKey", 'flavorName', f."flavorName",
      'netWeight', f."netWeight", 'price', f.price, 'compareAtPrice', f."compareAtPrice",
      'stock', f.stock, 'imageUrl', f."imageUrl", 'i18n', f.i18n, 'isActive', f."isActive"
    ) ORDER BY f."createdAt"
    ) FILTER (WHERE f.id IS NOT NULL AND f."isActive" = true AND f."deletedAt" IS NULL) as variants
  FROM "Product" p
  JOIN "Category" c ON c.id = p."categoryId"
  LEFT JOIN "ProductFlavor" f ON f."productId" = p.id
`;

export async function getByUser(userId: string) {
  const r = await db.query(
    `SELECT o.id, o."userId", o.status, o."deliveryType", o."paymentMethod",
      o."customerName", o."customerPhone",
      o."subtotalAmount", o."deliveryFee", o."serviceFee", o."discountAmount", o."totalAmount",
      o."addressId", o.city, o.district, o.street, o.house, o.apartment, o.landmark, o."deliveryInstructions",
      o.notes, o."createdAt", o."updatedAt",
      json_agg(json_build_object(
        'id', oi.id, 'flavorId', oi."flavorId", 'quantity', oi.quantity,
        'unitPrice', oi."unitPrice", 'skuSnapshot', oi."skuSnapshot",
        'nameSnapshot', oi."nameSnapshot", 'flavorSnapshot', oi."flavorSnapshot",
        'netWeightSnapshot', oi."netWeightSnapshot", 'imageSnapshot', oi."imageSnapshot"
      ) ORDER BY oi."createdAt") FILTER (WHERE oi.id IS NOT NULL) as items
     FROM "Order" o
     LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
     WHERE o."userId" = $1
     GROUP BY o.id ORDER BY o."createdAt" DESC`,
    [userId]
  );
  return r.rows;
}

export async function getAll(params: { status?: string; limit?: number; offset?: number }) {
  let where = "WHERE 1=1"; const values: any[] = []; let idx = 1;
  if (params.status) { where += ` AND o.status = $${idx++}`; values.push(params.status.toUpperCase()); }
  const limit = params.limit || 50; const offset = params.offset || 0;
  values.push(limit, offset);
  const r = await db.query(
    `SELECT o.id, o."userId", o.status, o."deliveryType", o."paymentMethod",
      o."customerName", o."customerPhone",
      o."subtotalAmount", o."deliveryFee", o."serviceFee", o."discountAmount", o."totalAmount",
      o."addressId", o.city, o.district, o.street, o.house, o.apartment, o.landmark, o."deliveryInstructions",
      o.notes, o."createdAt", o."updatedAt",
      u.phone as "userPhone", u."fullName" as "userFullName",
      json_agg(json_build_object(
        'id', oi.id, 'flavorId', oi."flavorId", 'quantity', oi.quantity,
        'unitPrice', oi."unitPrice", 'skuSnapshot', oi."skuSnapshot",
        'nameSnapshot', oi."nameSnapshot", 'flavorSnapshot', oi."flavorSnapshot",
        'netWeightSnapshot', oi."netWeightSnapshot", 'imageSnapshot', oi."imageSnapshot"
      ) ORDER BY oi."createdAt") FILTER (WHERE oi.id IS NOT NULL) as items
     FROM "Order" o
     LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
     JOIN "User" u ON u.id = o."userId"
     ${where}
     GROUP BY o.id, u.phone, u."fullName"
     ORDER BY o."createdAt" DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values
  );
  return r.rows;
}

export async function getOne(id: string) {
  const r = await db.query(
    `SELECT o.id, o."userId", o.status, o."deliveryType", o."paymentMethod",
      o."customerName", o."customerPhone",
      o."subtotalAmount", o."deliveryFee", o."serviceFee", o."discountAmount", o."totalAmount",
      o."addressId", o.city, o.district, o.street, o.house, o.apartment, o.landmark, o."deliveryInstructions",
      o.notes, o."createdAt", o."updatedAt",
      u.phone as "userPhone", u."fullName" as "userFullName",
      json_agg(json_build_object(
        'id', oi.id, 'flavorId', oi."flavorId", 'quantity', oi.quantity,
        'unitPrice', oi."unitPrice", 'skuSnapshot', oi."skuSnapshot",
        'nameSnapshot', oi."nameSnapshot", 'flavorSnapshot', oi."flavorSnapshot",
        'netWeightSnapshot', oi."netWeightSnapshot", 'imageSnapshot', oi."imageSnapshot"
      ) ORDER BY oi."createdAt") FILTER (WHERE oi.id IS NOT NULL) as items
     FROM "Order" o
     LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
     JOIN "User" u ON u.id = o."userId"
     WHERE o.id = $1
     GROUP BY o.id, u.phone, u."fullName"`,
    [id]
  );
  return r.rows[0] || null;
}

export async function createOrder(userId: string, data: any) {
  const items: any[] = data.items || [];
  if (!items.length) throw new Error("Cart is empty");

  // Read pricing from AppSetting (no hardcoded values)
  const isStandard = (data.deliveryType || "STANDARD").toUpperCase() === "STANDARD";
  const deliveryFee = await getSetting("delivery_fee", 9900);
  const serviceFee = 0; // Service fee removed from checkout

  let subtotal = 0;
  const enrichedItems: any[] = [];

  for (const item of items) {
    const flavorR = await db.query(
      `SELECT f.*, p.name as "productName"
       FROM "ProductFlavor" f JOIN "Product" p ON p.id = f."productId"
       WHERE (f.id = $1 OR f.sku = $1) AND f."isActive" = true AND f."deletedAt" IS NULL`,
      [item.flavorId]
    );
    const flavor = flavorR.rows[0];
    if (!flavor) throw new Error(`Product variant not found: ${item.flavorId}`);
    if (flavor.stock < item.quantity) throw new Error(`Insufficient stock for ${flavor.flavorName || flavor.flavorKey}`);
    const unitPrice = Number(flavor.price);
    subtotal += unitPrice * item.quantity;
    enrichedItems.push({ ...item, flavor, unitPrice, flavorDbId: flavor.id });
  }

  // Server-side promo validation - never trust client-sent discountAmount
  let discountAmount = 0;
  let promoRow: any = null;
  if (data.promoCode) {
    const pr = await db.query(
      `SELECT * FROM "PromoCode" WHERE code = $1 AND "isActive" = true`,
      [String(data.promoCode).toUpperCase().trim()]
    );
    promoRow = pr.rows[0];
    if (promoRow) {
      const expired = promoRow.expiresAt && new Date(promoRow.expiresAt) < new Date();
      const limitReached = promoRow.usageLimit && promoRow.usageCount >= promoRow.usageLimit;
      const minNotMet = promoRow.minOrderAmount && subtotal < Number(promoRow.minOrderAmount);
      if (!expired && !limitReached && !minNotMet) {
        if (promoRow.discountType === "percent") {
          discountAmount = Math.round(subtotal * Number(promoRow.discountValue) / 100);
        } else {
          discountAmount = Math.min(Number(promoRow.discountValue), subtotal);
        }
      }
    }
  }
  const totalAmount = subtotal + deliveryFee + serviceFee - discountAmount;

  // When a saved address is referenced, copy its fields into the order
  // so order history remains accurate even if the address is later deleted
  let addrData: any = {};
  if (data.addressId) {
    const addrR = await db.query(`SELECT * FROM "Address" WHERE id = $1`, [data.addressId]);
    if (addrR.rows[0]) addrData = addrR.rows[0];
  }

  const orderR = await db.query(
    `INSERT INTO "Order" (id, "userId", status, "deliveryType", "paymentMethod",
      "customerName", "customerPhone", "addressId",
      city, district, street, house, apartment, landmark, "deliveryInstructions",
      "subtotalAmount", "deliveryFee", "serviceFee", "discountAmount", "totalAmount",
      notes, "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, 'PENDING', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
             $14, $15, $16, $17, $18, $19, NOW(), NOW())
     RETURNING *`,
    [
      userId,
      (data.deliveryType || "STANDARD").toUpperCase(),
      (data.paymentMethod || "CARD").toUpperCase(),
      data.customerName || addrData.fullName || null,
      data.customerPhone || addrData.phone || null,
      data.addressId || null,
      data.city     || addrData.city     || null,
      data.district || addrData.district || null,
      data.street   || addrData.street   || null,
      data.house    || addrData.house    || null,
      data.apartment || addrData.apartment || null,
      data.landmark  || addrData.landmark  || null,
      data.deliveryInstructions || addrData.deliveryInstructions || null,
      subtotal, deliveryFee, serviceFee, discountAmount, totalAmount,
      data.notes || null,
    ]
  );
  const order = orderR.rows[0];

  for (const item of enrichedItems) {
    await db.query(
      `INSERT INTO "OrderItem" (id, "orderId", "flavorId", quantity, "unitPrice",
        "skuSnapshot", "nameSnapshot", "flavorSnapshot", "netWeightSnapshot", "imageSnapshot", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [order.id, item.flavorDbId, item.quantity, item.unitPrice,
       item.flavor.sku, item.flavor.productName,
       item.flavor.flavorName || item.flavor.flavorKey || null,
       item.flavor.netWeight || null, item.flavor.imageUrl || null]
    );
    await db.query(
      `UPDATE "ProductFlavor" SET stock = stock - $1, "updatedAt" = NOW() WHERE id = $2`,
      [item.quantity, item.flavorDbId]
    );
  }

  // Increment promo usage count after successful order
  if (promoRow) {
    await db.query(
      `UPDATE "PromoCode" SET "usageCount" = "usageCount" + 1, "updatedAt" = NOW() WHERE id = $1`,
      [promoRow.id]
    ).catch(() => {}); // non-critical
  }

  return getOne(order.id);
}

export async function updateStatus(id: string, status: string) {
  const valid = ["PENDING","PAID","SHIPPED","DELIVERED","CANCELLED","REFUNDED"];
  const upperStatus = status.toUpperCase();
  if (!valid.includes(upperStatus)) throw new Error("Invalid status");

  // Fetch current order before updating
  const current = await db.query(`SELECT * FROM "Order" WHERE id = $1`, [id]);
  if (!current.rows[0]) throw new Error("Order not found");
  const currentStatus = current.rows[0].status;

  // Restore stock when admin cancels or refunds a non-already-cancelled order
  const stockRestoringStatuses = ["CANCELLED", "REFUNDED"];
  const alreadyRestored = ["CANCELLED", "REFUNDED"];
  if (stockRestoringStatuses.includes(upperStatus) && !alreadyRestored.includes(currentStatus)) {
    const items = await db.query(`SELECT * FROM "OrderItem" WHERE "orderId" = $1`, [id]);
    for (const item of items.rows) {
      await db.query(
        `UPDATE "ProductFlavor" SET stock = stock + $1, "updatedAt" = NOW() WHERE id = $2`,
        [item.quantity, item.flavorId]
      );
    }
  }

  const r = await db.query(
    `UPDATE "Order" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
    [upperStatus, id]
  );
  return r.rows[0];
}

export async function cancelOrder(id: string, userId: string) {
  const r = await db.query(`SELECT * FROM "Order" WHERE id = $1 AND "userId" = $2`, [id, userId]);
  const order = r.rows[0];
  if (!order) throw new Error("Order not found");
  if (order.status !== "PENDING") throw new Error("Only pending orders can be cancelled");
  const items = await db.query(`SELECT * FROM "OrderItem" WHERE "orderId" = $1`, [id]);
  for (const item of items.rows) {
    await db.query(`UPDATE "ProductFlavor" SET stock = stock + $1, "updatedAt" = NOW() WHERE id = $2`, [item.quantity, item.flavorId]);
  }
  const updated = await db.query(
    `UPDATE "Order" SET status = 'CANCELLED', "updatedAt" = NOW() WHERE id = $1 RETURNING *`, [id]
  );
  return updated.rows[0];
}
