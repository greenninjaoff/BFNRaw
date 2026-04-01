"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const db_1 = __importDefault(require("../../db/db"));
const notify_1 = require("../../lib/notify");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/", async (req, res) => {
    try {
        const r = await db_1.default.query(`SELECT id, "maskedNumber", brand, holder, "createdAt" FROM "SavedCard" WHERE "userId" = $1 ORDER BY "createdAt" ASC`, [req.userId]);
        res.json(r.rows);
    }
    catch {
        res.json([]);
    }
});
router.post("/", async (req, res) => {
    try {
        const { maskedNumber, brand, holder } = req.body;
        if (!maskedNumber) {
            res.status(400).json({ error: "maskedNumber required" });
            return;
        }
        const r = await db_1.default.query(`INSERT INTO "SavedCard" (id, "userId", "maskedNumber", brand, holder, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING *`, [req.userId, maskedNumber, brand || null, holder || null]);
        await (0, notify_1.createNotification)(req.userId, "INFO", "Card added", `Card ending in ${maskedNumber.slice(-4)} was added to your account.`);
        res.status(201).json(r.rows[0]);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const cardR = await db_1.default.query(`SELECT "maskedNumber" FROM "SavedCard" WHERE id = $1 AND "userId" = $2`, [req.params.id, req.userId]);
        await db_1.default.query(`DELETE FROM "SavedCard" WHERE id = $1 AND "userId" = $2`, [req.params.id, req.userId]);
        if (cardR.rows[0])
            await (0, notify_1.createNotification)(req.userId, "INFO", "Card removed", `Card ending in ${cardR.rows[0].maskedNumber.slice(-4)} was removed.`);
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.default = router;
