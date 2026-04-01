import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../../middleware/auth";
import db from "../../db/db";
import { createNotification } from "../../lib/notify";

const router = Router();
router.use(requireAuth as any);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const r = await db.query(`SELECT id, "maskedNumber", brand, holder, "createdAt" FROM "SavedCard" WHERE "userId" = $1 ORDER BY "createdAt" ASC`, [req.userId]);
    res.json(r.rows);
  } catch { res.json([]); }
});
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { maskedNumber, brand, holder } = req.body;
    if (!maskedNumber) { res.status(400).json({ error: "maskedNumber required" }); return; }
    const r = await db.query(
      `INSERT INTO "SavedCard" (id, "userId", "maskedNumber", brand, holder, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [req.userId, maskedNumber, brand || null, holder || null]
    );
    await createNotification(req.userId!, "INFO", "Card added", `Card ending in ${maskedNumber.slice(-4)} was added to your account.`);
    res.status(201).json(r.rows[0]);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const cardR = await db.query(`SELECT "maskedNumber" FROM "SavedCard" WHERE id = $1 AND "userId" = $2`, [req.params.id, req.userId]);
    await db.query(`DELETE FROM "SavedCard" WHERE id = $1 AND "userId" = $2`, [req.params.id, req.userId]);
    if (cardR.rows[0]) await createNotification(req.userId!, "INFO", "Card removed", `Card ending in ${cardR.rows[0].maskedNumber.slice(-4)} was removed.`);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});
export default router;
