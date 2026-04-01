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
exports.getOne = getOne;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.createFlavor = createFlavor;
exports.updateFlavor = updateFlavor;
exports.deleteFlavor = deleteFlavor;
const svc = __importStar(require("./products.service"));
const p = (v) => String(v || "");
async function getAll(req, res) {
    try {
        const { category, search, admin } = req.query;
        if (admin === "1") {
            res.json(await svc.getAllForAdmin({ category, search }));
        }
        else {
            res.json(await svc.getAll({ category, search }));
        }
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
async function getOne(req, res) {
    try {
        const prod = await svc.getOne(p(req.params.slug));
        if (!prod) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json(prod);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
async function create(req, res) {
    try {
        res.status(201).json(await svc.createProduct(req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function update(req, res) {
    try {
        res.json(await svc.updateProduct(p(req.params.id), req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function remove(req, res) {
    try {
        res.json(await svc.softDeleteProduct(p(req.params.id)));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function createFlavor(req, res) {
    try {
        res.status(201).json(await svc.createFlavor(p(req.params.id), req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function updateFlavor(req, res) {
    try {
        res.json(await svc.updateFlavor(p(req.params.flavorId), req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
async function deleteFlavor(req, res) {
    try {
        res.json(await svc.deleteFlavor(p(req.params.flavorId)));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
}
