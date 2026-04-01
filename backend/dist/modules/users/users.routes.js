"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const db_1 = __importDefault(require("../../db/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAdmin);
// ─── LIST USERS ───────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const search = req.query.search;
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const offset = Number(req.query.offset) || 0;
        let where = `WHERE role != 'SUPERADMIN'`;
        const vals = [];
        if (search) {
            where += ` AND (phone ILIKE $1 OR "fullName" ILIKE $1)`;
            vals.push(`%${search}%`);
        }
        vals.push(limit, offset);
        const r = await db_1.default.query(`SELECT id, phone, "fullName", role, "isBlocked", "isPhoneVerified", "createdAt"
       FROM "User" ${where} ORDER BY "createdAt" DESC
       LIMIT $${vals.length - 1} OFFSET $${vals.length}`, vals);
        const total = await db_1.default.query(`SELECT COUNT(*) FROM "User" WHERE role != 'SUPERADMIN'`);
        res.json({ users: r.rows, total: Number(total.rows[0].count) });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── GET SINGLE USER (rich) ───────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const userR = await db_1.default.query(`SELECT id, phone, "fullName", role, "isBlocked", "isPhoneVerified", "createdAt", "updatedAt"
       FROM "User" WHERE id = $1`, [id]);
        if (!userR.rows[0]) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Order stats
        const statsR = await db_1.default.query(`SELECT COUNT(*) as "orderCount",
              COALESCE(SUM("totalAmount"), 0) as "totalSpent"
       FROM "Order"
       WHERE "userId" = $1 AND status NOT IN ('CANCELLED', 'REFUNDED')`, [id]);
        // Recent orders (last 10) with items
        const ordersR = await db_1.default.query(`SELECT o.id, o.status, o."deliveryType", o."paymentMethod",
              o."totalAmount", o."subtotalAmount", o."deliveryFee",
              o.city, o.district, o.street, o.house, o.apartment, o."deliveryInstructions",
              o."createdAt",
              json_agg(json_build_object(
                'nameSnapshot', oi."nameSnapshot",
                'flavorSnapshot', oi."flavorSnapshot",
                'netWeightSnapshot', oi."netWeightSnapshot",
                'imageSnapshot', oi."imageSnapshot",
                'quantity', oi.quantity,
                'unitPrice', oi."unitPrice"
              ) ORDER BY oi."createdAt") FILTER (WHERE oi.id IS NOT NULL) as items
       FROM "Order" o
       LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
       WHERE o."userId" = $1
       GROUP BY o.id
       ORDER BY o."createdAt" DESC
       LIMIT 10`, [id]);
        // Saved addresses
        const addressesR = await db_1.default.query(`SELECT id, title, city, district, street, house, apartment, landmark,
              "deliveryInstructions", lat, lng, "isDefault"
       FROM "Address" WHERE "userId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC`, [id]);
        // Saved cards (masked — safe to show)
        const cardsR = await db_1.default.query(`SELECT id, "maskedNumber", brand, "createdAt"
       FROM "SavedCard" WHERE "userId" = $1 ORDER BY "createdAt" ASC`, [id]);
        res.json({
            ...userR.rows[0],
            orderCount: Number(statsR.rows[0].orderCount),
            totalSpent: Number(statsR.rows[0].totalSpent),
            orders: ordersR.rows,
            addresses: addressesR.rows,
            cards: cardsR.rows,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ─── UPDATE USER ──────────────────────────────────────────────────────────────
router.patch("/:id", async (req, res) => {
    try {
        const { fullName, phone, role, isBlocked, password } = req.body;
        const fields = [];
        const vals = [];
        let i = 1;
        if (fullName !== undefined) {
            fields.push(`"fullName" = $${i++}`);
            vals.push(fullName);
        }
        if (phone !== undefined) {
            fields.push(`phone = $${i++}`);
            vals.push(phone);
        }
        if (role !== undefined) {
            fields.push(`role = $${i++}`);
            vals.push(role);
        }
        if (isBlocked !== undefined) {
            fields.push(`"isBlocked" = $${i++}`);
            vals.push(isBlocked);
        }
        if (password) {
            const h = await bcrypt_1.default.hash(password, 10);
            fields.push(`password = $${i++}`);
            vals.push(h);
        }
        if (!fields.length) {
            res.status(400).json({ error: "Nothing to update" });
            return;
        }
        vals.push(req.params.id);
        const r = await db_1.default.query(`UPDATE "User" SET ${fields.join(", ")}, "updatedAt" = NOW()
       WHERE id = $${i}
       RETURNING id, phone, "fullName", role, "isBlocked", "isPhoneVerified", "createdAt", "updatedAt"`, vals);
        res.json(r.rows[0]);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
// ─── BLOCK USER ───────────────────────────────────────────────────────────────
router.patch("/:id/block", async (req, res) => {
    try {
        const r = await db_1.default.query(`UPDATE "User" SET "isBlocked" = $1, "updatedAt" = NOW()
       WHERE id = $2 RETURNING id, phone, "fullName", role, "isBlocked"`, [req.body.isBlocked, req.params.id]);
        res.json(r.rows[0]);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.default = router;
