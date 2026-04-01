import { Response } from "express";
import * as svc from "./addresses.service";
import { AuthRequest } from "../../middleware/auth";
import { createNotification } from "../../lib/notify";

const p = (v: any) => String(v);

export async function getAll(req: AuthRequest, res: Response) {
  try { res.json(await svc.getByUser(req.userId!)); } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function createOne(req: AuthRequest, res: Response) {
  try {
    const result = await svc.create(req.userId!, req.body);
    await createNotification(req.userId!, "INFO", "Address saved", `New address "${req.body.title || "address"}" was added.`);
    res.status(201).json(result);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function updateOne(req: AuthRequest, res: Response) {
  try {
    const result = await svc.update(p(req.params.id), req.userId!, req.body);
    await createNotification(req.userId!, "INFO", "Address updated", `Address "${req.body.title || "address"}" was updated.`);
    res.json(result);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function deleteOne(req: AuthRequest, res: Response) {
  try { res.json(await svc.remove(p(req.params.id), req.userId!)); } catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function setDefault(req: AuthRequest, res: Response) {
  try { res.json(await svc.setDefault(p(req.params.id), req.userId!)); } catch (e: any) { res.status(400).json({ error: e.message }); }
}
