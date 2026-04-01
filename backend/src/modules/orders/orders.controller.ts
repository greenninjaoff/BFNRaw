import { Response } from "express";
import * as svc from "./orders.service";
import { AuthRequest } from "../../middleware/auth";
import { createNotification } from "../../lib/notify";
import { broadcastSSE } from "../admin/admin.routes";

const p = (v: any) => String(v);

const STATUS_MSG: Record<string, string> = {
  PAID:      "Your payment was confirmed. We're preparing your order.",
  SHIPPED:   "Your order is on the way!",
  DELIVERED: "Your order has been delivered. Enjoy!",
  CANCELLED: "Your order has been cancelled.",
  REFUNDED:  "Your refund has been processed.",
};

export async function getMyOrders(req: AuthRequest, res: Response) {
  try { res.json(await svc.getByUser(req.userId!)); } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function getAllOrders(req: AuthRequest, res: Response) {
  try {
    const { status, limit, offset } = req.query;
    res.json(await svc.getAll({ status: status ? p(status) : undefined, limit: Number(limit) || 50, offset: Number(offset) || 0 }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function getOneOrder(req: AuthRequest, res: Response) {
  try {
    const o = await svc.getOne(p(req.params.id));
    if (!o) { res.status(404).json({ error: "Not found" }); return; }
    res.json(o);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function create(req: AuthRequest, res: Response) {
  try {
    const order = await svc.createOrder(req.userId!, req.body);
    const shortId = order.id.slice(-8).toUpperCase();
    broadcastSSE("new_order", { id: order.id, total: order.totalAmount, status: order.status });
    await createNotification(req.userId!, "ORDER", "Order placed", `Order #${shortId} placed. Total: ${Number(order.totalAmount).toLocaleString("ru-RU")} sum.`);
    res.status(201).json(order);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function updateStatus(req: AuthRequest, res: Response) {
  try {
    const order = await svc.updateStatus(p(req.params.id), req.body.status);
    const msg = STATUS_MSG[order.status];
    broadcastSSE("order_status", { id: order.id, status: order.status });
    if (msg) {
      const shortId = order.id.slice(-8).toUpperCase();
      await createNotification(order.userId, "ORDER", `Order #${shortId} - ${order.status}`, msg);
    }
    res.json(order);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
}
export async function cancelMyOrder(req: AuthRequest, res: Response) {
  try {
    const order = await svc.cancelOrder(p(req.params.id), req.userId!);
    await createNotification(req.userId!, "ORDER", `Order #${order.id.slice(-8).toUpperCase()} cancelled`, "Your order has been cancelled.");
    res.json(order);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
}
