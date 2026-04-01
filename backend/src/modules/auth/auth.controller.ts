import { Request, Response } from "express";
import * as authService from "./auth.service";
import { AuthRequest } from "../../middleware/auth";
import { createNotification } from "../../lib/notify";

export async function register(req: Request, res: Response) {
  try {
    const { phone, password, fullName } = req.body;
    if (!phone || !password) { res.status(400).json({ error: "Phone and password required" }); return; }
    const result = await authService.register(phone.trim(), password, fullName?.trim());
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
}
export async function login(req: Request, res: Response) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) { res.status(400).json({ error: "Phone and password required" }); return; }
    res.json(await authService.login(phone.trim(), password));
  } catch (err: any) { res.status(401).json({ error: err.message }); }
}
export async function me(req: AuthRequest, res: Response) {
  try { res.json(await authService.me(req.userId!)); }
  catch (err: any) { res.status(404).json({ error: err.message }); }
}
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const { fullName, phone } = req.body;
    const user = await authService.updateProfile(req.userId!, { fullName, phone });
    await createNotification(req.userId!, "INFO", "Profile updated", "Your account information was updated.");
    res.json(user);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
}
export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) { res.status(400).json({ error: "Both passwords required" }); return; }
    await authService.changePassword(req.userId!, currentPassword, newPassword);
    await createNotification(req.userId!, "SYSTEM", "Password changed", "Your password was changed. If this wasn't you, contact support immediately.");
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
}
export async function requestReset(req: Request, res: Response) {
  try {
    const { phone } = req.body;
    if (!phone) { res.status(400).json({ error: "Phone required" }); return; }
    const code = await authService.requestPasswordReset(phone.trim());
    const isDev = process.env.NODE_ENV !== "production";
    res.json({ success: true, ...(isDev ? { code } : {}) });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
}
export async function resetPassword(req: Request, res: Response) {
  try {
    const { phone, code, newPassword } = req.body;
    if (!phone || !code || !newPassword) { res.status(400).json({ error: "phone, code, newPassword required" }); return; }
    await authService.resetPassword(phone.trim(), code.trim(), newPassword);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
}
