"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByUser = getByUser;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.setDefault = setDefault;
const db_1 = __importDefault(require("../../db/db"));
async function getByUser(userId) {
    const r = await db_1.default.query(`SELECT * FROM "Address" WHERE "userId" = $1 ORDER BY "isDefault" DESC, "createdAt" ASC`, [userId]);
    return r.rows;
}
async function create(userId, data) {
    // If this is set as default, unset others first
    if (data.isDefault) {
        await db_1.default.query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
    }
    const r = await db_1.default.query(`INSERT INTO "Address" (id, "userId", title, "fullName", phone, city, district, street, house, apartment, landmark, "deliveryInstructions", lat, lng, "isDefault", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
     RETURNING *`, [
        userId, data.title || null, data.fullName || null, data.phone || null,
        data.city || null, data.district || null, data.street || null, data.house || null,
        data.apartment || null, data.landmark || null, data.deliveryInstructions || null,
        data.lat || null, data.lng || null, data.isDefault ?? false,
    ]);
    return r.rows[0];
}
async function update(id, userId, data) {
    // Verify ownership
    const own = await db_1.default.query(`SELECT id FROM "Address" WHERE id = $1 AND "userId" = $2`, [id, userId]);
    if (!own.rows[0])
        throw new Error("Address not found");
    if (data.isDefault) {
        await db_1.default.query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
    }
    const fields = [];
    const values = [];
    let idx = 1;
    const allowed = ["title", "fullName", "phone", "city", "district", "street", "house", "apartment", "landmark", "deliveryInstructions", "lat", "lng", "isDefault"];
    for (const key of allowed) {
        if (data[key] !== undefined) {
            fields.push(`"${key}" = $${idx++}`);
            values.push(data[key]);
        }
    }
    if (!fields.length)
        throw new Error("Nothing to update");
    fields.push(`"updatedAt" = NOW()`);
    values.push(id);
    const r = await db_1.default.query(`UPDATE "Address" SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values);
    return r.rows[0];
}
async function remove(id, userId) {
    const own = await db_1.default.query(`SELECT id FROM "Address" WHERE id = $1 AND "userId" = $2`, [id, userId]);
    if (!own.rows[0])
        throw new Error("Address not found");
    await db_1.default.query(`DELETE FROM "Address" WHERE id = $1`, [id]);
    return { success: true };
}
async function setDefault(id, userId) {
    const own = await db_1.default.query(`SELECT id FROM "Address" WHERE id = $1 AND "userId" = $2`, [id, userId]);
    if (!own.rows[0])
        throw new Error("Address not found");
    await db_1.default.query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
    const r = await db_1.default.query(`UPDATE "Address" SET "isDefault" = true, "updatedAt" = NOW() WHERE id = $1 RETURNING *`, [id]);
    return r.rows[0];
}
