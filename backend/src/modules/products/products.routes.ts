import { Router } from "express";
import * as ctrl from "./products.controller";
import { requireAdmin } from "../../middleware/auth";

const router = Router();
router.get("/", ctrl.getAll);
router.get("/:slug", ctrl.getOne);
router.post("/", requireAdmin as any, ctrl.create as any);
router.patch("/:id", requireAdmin as any, ctrl.update as any);
router.delete("/:id", requireAdmin as any, ctrl.remove as any);
router.post("/:id/flavors", requireAdmin as any, ctrl.createFlavor as any);
router.patch("/:id/flavors/:flavorId", requireAdmin as any, ctrl.updateFlavor as any);
router.delete("/:id/flavors/:flavorId", requireAdmin as any, ctrl.deleteFlavor as any);
export default router;
