import { Router } from "express";
import * as controller from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.post("/register",        controller.register);
router.post("/login",           controller.login);
router.get("/me",               requireAuth as any, controller.me as any);
router.patch("/me",             requireAuth as any, controller.updateProfile as any);
router.post("/change-password", requireAuth as any, controller.changePassword as any);
router.post("/reset/request",   controller.requestReset as any);
router.post("/reset/confirm",   controller.resetPassword as any);
export default router;
