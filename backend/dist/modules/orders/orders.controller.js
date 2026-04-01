"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrders = getMyOrders;
exports.getAllOrders = getAllOrders;
exports.getOneOrder = getOneOrder;
exports.create = create;
exports.updateStatus = updateStatus;
exports.cancelMyOrder = cancelMyOrder;
const svc = __importStar(require("./orders.service"));
const notify_1 = require("../../lib/notify");
const admin_routes_1 = require("../admin/admin.routes");
const p = (v) => String(v);
const STATUS_MSG = {
    PAID: "Your payment was confirmed. We're preparing your order.",
    SHIPPED: "Your order is on the way!",
    DELIVERED: "Your order has been delivered. Enjoy!",
    CANCELLED: "Your order has been cancelled.",
    REFUNDED: "Your refund has been processed.",
};
async function getMyOrders(req, res) {
    try {
        res.json(await svc.getByUser(req.userId));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
async function getAllOrders(req, res) {
    try {
        const { status, limit, offset } = req.query;
        res.json(await svc.getAll({ status: status ? p(status) : undefined, limit: Number(limit) || 50, offset: Number(offset) || 0 }));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
async function getOneOrder(req, res) {
    try {
        const o = await svc.getOne(p(req.params.id));
        if (!o) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json(o);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
async function create(req, res) {
    try {
        const order = await svc.createOrder(req.userId, req.body);
        const shortId = order.id.slice(-8).toUpperCase();
        (0, admin_routes_1.broadcastSSE)("new_order", { id: order.id, total: order.totalAmount, status: order.status });
        await (0, notify_1.createNotification)(req.userId, "ORDER", "Order placed", `Order #${shortId} placed. Total: ${Number(order.totalAmount).toLocaleString("ru-RU")} sum.`);
        res.status(201).json(order);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function updateStatus(req, res) {
    try {
        const order = await svc.updateStatus(p(req.params.id), req.body.status);
        const msg = STATUS_MSG[order.status];
        (0, admin_routes_1.broadcastSSE)("order_status", { id: order.id, status: order.status });
        if (msg) {
            const shortId = order.id.slice(-8).toUpperCase();
            await (0, notify_1.createNotification)(order.userId, "ORDER", `Order #${shortId} - ${order.status}`, msg);
        }
        res.json(order);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function cancelMyOrder(req, res) {
    try {
        const order = await svc.cancelOrder(p(req.params.id), req.userId);
        await (0, notify_1.createNotification)(req.userId, "ORDER", `Order #${order.id.slice(-8).toUpperCase()} cancelled`, "Your order has been cancelled.");
        res.json(order);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
