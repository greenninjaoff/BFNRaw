"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const db_1 = __importDefault(require("../../db/db"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/", async (req, res) => {
    try {
        const r = await db_1.default.query(`SELECT id, type, title, message, "isRead", "createdAt"
       FROM "Notification" WHERE "userId" = $1
       ORDER BY "createdAt" DESC LIMIT 50`, [req.userId]);
        res.json(r.rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post("/:id/read", async (req, res) => {
    try {
        await db_1.default.query(`UPDATE "Notification" SET "isRead" = true, "updatedAt" = NOW()
       WHERE id = $1 AND "userId" = $2`, [req.params.id, req.userId]);
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.post("/read-all", async (req, res) => {
    try {
        await db_1.default.query(`UPDATE "Notification" SET "isRead" = true, "updatedAt" = NOW() WHERE "userId" = $1`, [req.userId]);
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.default = router;
