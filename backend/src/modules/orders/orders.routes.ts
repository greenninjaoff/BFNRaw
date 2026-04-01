import { Router } from "express";
import * as ctrl from "./orders.controller";
import { requireAuth, requireAdmin } from "../../middleware/auth";

const router = Router();
// User routes
router.get("/my", requireAuth as any, ctrl.getMyOrders as any);
router.post("/", requireAuth as any, ctrl.create as any);
router.post("/:id/cancel", requireAuth as any, ctrl.cancelMyOrder as any);
// User can fetch their own order by id
router.get("/:id/detail", requireAuth as any, async (req: any, res: any) => {
  try {
    const order = await require("./orders.service").getOne(req.params.id);
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    if (order.userId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json(order);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
// Admin routes
router.get("/", requireAdmin as any, ctrl.getAllOrders as any);
router.get("/:id", requireAdmin as any, ctrl.getOneOrder as any);
router.patch("/:id/status", requireAdmin as any, ctrl.updateStatus as any);
export default router;
