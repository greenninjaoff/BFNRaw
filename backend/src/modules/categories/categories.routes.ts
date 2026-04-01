import { Router, Request, Response } from "express";
import { requireAdmin, AuthRequest } from "../../middleware/auth";
import * as svc from "./categories.service";

const router = Router();
const p = (v: any) => String(v);

// Public: returns active categories with all name fields
router.get("/", async (req: Request, res: Response) => {
  try {
    const isAdmin = (req.query.admin === "1");
    res.json(isAdmin ? await svc.getAllForAdmin() : await svc.getAll());
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/", requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try { res.status(201).json(await svc.create(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.patch("/:id", requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try { res.json(await svc.update(p(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete("/:id", requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try { res.json(await svc.remove(p(req.params.id))); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
