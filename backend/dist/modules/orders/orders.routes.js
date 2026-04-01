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
const express_1 = require("express");
const ctrl = __importStar(require("./orders.controller"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// User routes
router.get("/my", auth_1.requireAuth, ctrl.getMyOrders);
router.post("/", auth_1.requireAuth, ctrl.create);
router.post("/:id/cancel", auth_1.requireAuth, ctrl.cancelMyOrder);
// User can fetch their own order by id
router.get("/:id/detail", auth_1.requireAuth, async (req, res) => {
    try {
        const order = await require("./orders.service").getOne(req.params.id);
        if (!order) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        if (order.userId !== req.userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        res.json(order);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Admin routes
router.get("/", auth_1.requireAdmin, ctrl.getAllOrders);
router.get("/:id", auth_1.requireAdmin, ctrl.getOneOrder);
router.patch("/:id/status", auth_1.requireAdmin, ctrl.updateStatus);
exports.default = router;
