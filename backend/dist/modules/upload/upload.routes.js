"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), "uploads");
// Ensure base dir and subdirs exist
const SUBDIRS = ["products", "logos", "icons"];
for (const sub of [BASE_UPLOAD_DIR, ...SUBDIRS.map((s) => path_1.default.join(BASE_UPLOAD_DIR, s))]) {
    if (!fs_1.default.existsSync(sub))
        fs_1.default.mkdirSync(sub, { recursive: true });
}
// Allowed subfolders via query param ?folder=products (default: products)
function resolveFolder(folder) {
    const safe = ["products", "logos", "icons"];
    const sub = safe.includes(folder || "") ? folder : "products";
    return path_1.default.join(BASE_UPLOAD_DIR, sub);
}
const storage = multer_1.default.diskStorage({
    destination: (req, _file, cb) => {
        const folder = resolveFolder(req.query?.folder);
        cb(null, folder);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase() || ".jpg";
        const base = path_1.default.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .toLowerCase()
            .slice(0, 40);
        const unique = `${base}-${Date.now()}${ext}`;
        cb(null, unique);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext))
        cb(null, true);
    else
        cb(new Error("Only image files are allowed (jpg, png, webp, gif, avif)"));
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});
const router = (0, express_1.Router)();
router.use(auth_1.requireAdmin);
/**
 * POST /api/upload/image?folder=products
 * Returns: { url: "/uploads/products/filename.jpg", filename: "filename.jpg", folder: "products" }
 *
 * The returned `url` is the exact value to store in DB and use in client.
 * Backend serves it as static at GET /uploads/products/filename.jpg
 */
router.post("/image", upload.single("file"), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    const folder = req.query?.folder || "products";
    const safe = ["products", "logos", "icons"].includes(folder) ? folder : "products";
    const url = `/uploads/${safe}/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, folder: safe });
});
exports.default = router;
