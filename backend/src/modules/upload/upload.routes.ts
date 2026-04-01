import { Router, Request, Response } from "express";
import { requireAdmin } from "../../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// Ensure base dir and subdirs exist
const SUBDIRS = ["products", "logos", "icons"];
for (const sub of [BASE_UPLOAD_DIR, ...SUBDIRS.map((s) => path.join(BASE_UPLOAD_DIR, s))]) {
  if (!fs.existsSync(sub)) fs.mkdirSync(sub, { recursive: true });
}

// Allowed subfolders via query param ?folder=products (default: products)
function resolveFolder(folder?: string): string {
  const safe = ["products", "logos", "icons"];
  const sub = safe.includes(folder || "") ? folder! : "products";
  return path.join(BASE_UPLOAD_DIR, sub);
}

const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const folder = resolveFolder(req.query?.folder as string);
    cb(null, folder);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const unique = `${base}-${Date.now()}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Only image files are allowed (jpg, png, webp, gif, avif)"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

const router = Router();
router.use(requireAdmin as any);

/**
 * POST /api/upload/image?folder=products
 * Returns: { url: "/uploads/products/filename.jpg", filename: "filename.jpg", folder: "products" }
 *
 * The returned `url` is the exact value to store in DB and use in client.
 * Backend serves it as static at GET /uploads/products/filename.jpg
 */
router.post("/image", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  const folder = (req.query?.folder as string) || "products";
  const safe = ["products", "logos", "icons"].includes(folder) ? folder : "products";
  const url = `/uploads/${safe}/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, folder: safe });
});

export default router;
