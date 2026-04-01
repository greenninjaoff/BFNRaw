import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import { runMigrations } from "./db/migrate";
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/products/products.routes";
import categoryRoutes from "./modules/categories/categories.routes";
import orderRoutes from "./modules/orders/orders.routes";
import addressRoutes from "./modules/addresses/addresses.routes";
import userRoutes from "./modules/users/users.routes";
import adminRoutes from "./modules/admin/admin.routes";
import cardRoutes from "./modules/cards/cards.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import uploadRoutes from "./modules/upload/upload.routes";

const app = express();
const allOrigins = [
  process.env.CLIENT_URL  || "http://localhost:3000",
  process.env.ADMIN_URL   || "http://localhost:3001",
  ...(process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
];
app.use(cors({ origin: (o, cb) => (!o || allOrigins.includes(o) ? cb(null, true) : cb(new Error(`CORS: ${o}`))), credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Serve uploaded images statically — covers /uploads/products/, /uploads/logos/, /uploads/icons/
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
// Ensure subdirectories exist at startup
import("fs").then((fs) => {
  for (const sub of [UPLOAD_DIR, "products", "logos", "icons"].map((s) =>
    s === UPLOAD_DIR ? s : require("path").join(UPLOAD_DIR, s)
  )) {
    if (!fs.existsSync(sub)) fs.mkdirSync(sub, { recursive: true });
  }
}).catch(() => {});
app.use("/uploads", express.static(UPLOAD_DIR, {
  maxAge: "7d",
  setHeaders: (res) => { res.setHeader("Access-Control-Allow-Origin", "*"); },
}));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Public settings endpoint
app.get("/api/settings", async (_req, res) => {
  const db = (await import("./db/db")).default;
  try {
    const r = await db.query(`SELECT key, value FROM "AppSetting" ORDER BY key`);
    const s: Record<string, string> = {};
    for (const row of r.rows) s[row.key] = row.value;
    res.json(s);
  } catch { res.json({}); }
});

app.use("/api/auth",          authRoutes);
app.use("/api/products",      productRoutes);
app.use("/api/categories",    categoryRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/addresses",     addressRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/cards",         cardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload",        uploadRoutes);


// Public promo-code validation endpoint
app.post("/api/promo/validate", async (req: any, res: any) => {
  const db = (await import("./db/db")).default;
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code) { res.status(400).json({ error: "code required" }); return; }
    const r = await db.query(
      `SELECT * FROM "PromoCode" WHERE code = $1`,
      [String(code).toUpperCase().trim()]
    );
    const promo = r.rows[0];
    if (!promo) { res.status(404).json({ valid: false, error: "Code not found" }); return; }
    if (!promo.isActive) { res.status(400).json({ valid: false, error: "Code is inactive" }); return; }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      res.status(400).json({ valid: false, error: "Code has expired" }); return;
    }
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      res.status(400).json({ valid: false, error: "Usage limit reached" }); return;
    }
    if (promo.minOrderAmount && subtotal < Number(promo.minOrderAmount)) {
      res.status(400).json({ valid: false, error: `Minimum order amount is ${Number(promo.minOrderAmount).toLocaleString("ru-RU")} sum` }); return;
    }
    // Calculate discount amount
    let discountAmount = 0;
    if (promo.discountType === "percent") {
      discountAmount = Math.round(subtotal * Number(promo.discountValue) / 100);
    } else {
      discountAmount = Math.min(Number(promo.discountValue), subtotal);
    }
    res.json({
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discountAmount,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// Public analytics event ingestion (no auth required — client uses sessionId)
app.post("/api/analytics/event", async (req: any, res: any) => {
  const db = (await import("./db/db")).default;
  try {
    const VALID_TYPES = ["PRODUCT_VIEW","ADD_TO_CART","CHECKOUT_START","ORDER_PLACED","PAYMENT_SUCCESS"];
    const { eventType, sessionId, userId, productId, orderId, metadata } = req.body;
    if (!VALID_TYPES.includes(eventType)) {
      res.status(400).json({ error: "invalid eventType" }); return;
    }
    await db.query(
      `INSERT INTO "AnalyticsEvent" (id,"eventType","sessionId","userId","productId","orderId",metadata,"createdAt")
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,NOW())`,
      [eventType, sessionId || null, userId || null, productId || null, orderId || null,
       metadata ? JSON.stringify(metadata) : null]
    );
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
async function start() {
  try { await runMigrations(); console.log("✓ Migrations applied"); }
  catch (e) { console.error("Migration error:", e); }
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}
start();
export default app;
