import { Router } from "express";
import * as ctrl from "./addresses.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth as any);
router.get("/", ctrl.getAll as any);
router.post("/", ctrl.createOne as any);
router.patch("/:id", ctrl.updateOne as any);
router.delete("/:id", ctrl.deleteOne as any);
router.post("/:id/default", ctrl.setDefault as any);
export default router;
