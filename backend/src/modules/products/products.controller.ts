import { Request, Response } from "express";
import * as svc from "./products.service";
import { AuthRequest } from "../../middleware/auth";

const p = (v: any) => String(v || "");

export async function getAll(req: Request, res: Response) {
  try {
    const { category, search, admin } = req.query as Record<string, string>;
    if (admin === "1") {
      res.json(await svc.getAllForAdmin({ category, search }));
    } else {
      res.json(await svc.getAll({ category, search }));
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function getOne(req: Request, res: Response) {
  try {
    const prod = await svc.getOne(p(req.params.slug));
    if (!prod) { res.status(404).json({ error: "Not found" }); return; }
    res.json(prod);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function create(req: AuthRequest, res: Response) {
  try { res.status(201).json(await svc.createProduct(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function update(req: AuthRequest, res: Response) {
  try { res.json(await svc.updateProduct(p(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function remove(req: AuthRequest, res: Response) {
  try { res.json(await svc.softDeleteProduct(p(req.params.id))); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function createFlavor(req: AuthRequest, res: Response) {
  try { res.status(201).json(await svc.createFlavor(p(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function updateFlavor(req: AuthRequest, res: Response) {
  try { res.json(await svc.updateFlavor(p(req.params.flavorId), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function deleteFlavor(req: AuthRequest, res: Response) {
  try { res.json(await svc.deleteFlavor(p(req.params.flavorId))); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
}
