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
exports.getAll = getAll;
exports.createOne = createOne;
exports.updateOne = updateOne;
exports.deleteOne = deleteOne;
exports.setDefault = setDefault;
const svc = __importStar(require("./addresses.service"));
const notify_1 = require("../../lib/notify");
const p = (v) => String(v);
async function getAll(req, res) {
    try {
        res.json(await svc.getByUser(req.userId));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
async function createOne(req, res) {
    try {
        const result = await svc.create(req.userId, req.body);
        await (0, notify_1.createNotification)(req.userId, "INFO", "Address saved", `New address "${req.body.title || "address"}" was added.`);
        res.status(201).json(result);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function updateOne(req, res) {
    try {
        const result = await svc.update(p(req.params.id), req.userId, req.body);
        await (0, notify_1.createNotification)(req.userId, "INFO", "Address updated", `Address "${req.body.title || "address"}" was updated.`);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function deleteOne(req, res) {
    try {
        res.json(await svc.remove(p(req.params.id), req.userId));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function setDefault(req, res) {
    try {
        res.json(await svc.setDefault(p(req.params.id), req.userId));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
