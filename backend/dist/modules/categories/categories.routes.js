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
const auth_1 = require("../../middleware/auth");
const svc = __importStar(require("./categories.service"));
const router = (0, express_1.Router)();
const p = (v) => String(v);
// Public: returns active categories with all name fields
router.get("/", async (req, res) => {
    try {
        const isAdmin = (req.query.admin === "1");
        res.json(isAdmin ? await svc.getAllForAdmin() : await svc.getAll());
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post("/", auth_1.requireAdmin, async (req, res) => {
    try {
        res.status(201).json(await svc.create(req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.patch("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        res.json(await svc.update(p(req.params.id), req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.delete("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        res.json(await svc.remove(p(req.params.id)));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.default = router;
