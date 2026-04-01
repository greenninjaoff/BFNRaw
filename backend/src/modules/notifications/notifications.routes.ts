import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../../middleware/auth";
import db from "../../db/db";

const router = Router();
router.use(requireAuth as any);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const r = await db.query(
      `SELECT id, type, title, message, "isRead", "createdAt"
       FROM "Notification" WHERE "userId" = $1
       ORDER BY "createdAt" DESC LIMIT 50`,
      [req.userId]
    );
    res.json(r.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/:id/read", async (req: AuthRequest, res: Response) => {
  try {
    await db.query(
      `UPDATE "Notification" SET "isRead" = true, "updatedAt" = NOW()
       WHERE id = $1 AND "userId" = $2`,
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post("/read-all", async (req: AuthRequest, res: Response) => {
  try {
    await db.query(
      `UPDATE "Notification" SET "isRead" = true, "updatedAt" = NOW() WHERE "userId" = $1`,
      [req.userId]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
