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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const migrate_1 = require("./db/migrate");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const products_routes_1 = __importDefault(require("./modules/products/products.routes"));
const categories_routes_1 = __importDefault(require("./modules/categories/categories.routes"));
const orders_routes_1 = __importDefault(require("./modules/orders/orders.routes"));
const addresses_routes_1 = __importDefault(require("./modules/addresses/addresses.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const cards_routes_1 = __importDefault(require("./modules/cards/cards.routes"));
const notifications_routes_1 = __importDefault(require("./modules/notifications/notifications.routes"));
const upload_routes_1 = __importDefault(require("./modules/upload/upload.routes"));
const app = (0, express_1.default)();
const allOrigins = [
    process.env.CLIENT_URL || "http://localhost:3000",
    process.env.ADMIN_URL || "http://localhost:3001",
    ...(process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
];
app.use((0, cors_1.default)({ origin: (o, cb) => (!o || allOrigins.includes(o) ? cb(null, true) : cb(new Error(`CORS: ${o}`))), credentials: true }));
app.use(express_1.default.json({ limit: "10mb" }));
// Serve uploaded images statically — covers /uploads/products/, /uploads/logos/, /uploads/icons/
const UPLOAD_DIR = process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), "uploads");
// Ensure subdirectories exist at startup
Promise.resolve().then(() => __importStar(require("fs"))).then((fs) => {
    for (const sub of [UPLOAD_DIR, "products", "logos", "icons"].map((s) => s === UPLOAD_DIR ? s : require("path").join(UPLOAD_DIR, s))) {
        if (!fs.existsSync(sub))
            fs.mkdirSync(sub, { recursive: true });
    }
}).catch(() => { });
app.use("/uploads", express_1.default.static(UPLOAD_DIR, {
    maxAge: "7d",
    setHeaders: (res) => { res.setHeader("Access-Control-Allow-Origin", "*"); },
}));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
// Public settings endpoint
app.get("/api/settings", async (_req, res) => {
    const db = (await Promise.resolve().then(() => __importStar(require("./db/db")))).default;
    try {
        const r = await db.query(`SELECT key, value FROM "AppSetting" ORDER BY key`);
        const s = {};
        for (const row of r.rows)
            s[row.key] = row.value;
        res.json(s);
    }
    catch {
        res.json({});
    }
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/products", products_routes_1.default);
app.use("/api/categories", categories_routes_1.default);
app.use("/api/orders", orders_routes_1.default);
app.use("/api/addresses", addresses_routes_1.default);
app.use("/api/users", users_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/cards", cards_routes_1.default);
app.use("/api/notifications", notifications_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
// Public promo-code validation endpoint
app.post("/api/promo/validate", async (req, res) => {
    const db = (await Promise.resolve().then(() => __importStar(require("./db/db")))).default;
    try {
        const { code, subtotal = 0 } = req.body;
        if (!code) {
            res.status(400).json({ error: "code required" });
            return;
        }
        const r = await db.query(`SELECT * FROM "PromoCode" WHERE code = $1`, [String(code).toUpperCase().trim()]);
        const promo = r.rows[0];
        if (!promo) {
            res.status(404).json({ valid: false, error: "Code not found" });
            return;
        }
        if (!promo.isActive) {
            res.status(400).json({ valid: false, error: "Code is inactive" });
            return;
        }
        if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
            res.status(400).json({ valid: false, error: "Code has expired" });
            return;
        }
        if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
            res.status(400).json({ valid: false, error: "Usage limit reached" });
            return;
        }
        if (promo.minOrderAmount && subtotal < Number(promo.minOrderAmount)) {
            res.status(400).json({ valid: false, error: `Minimum order amount is ${Number(promo.minOrderAmount).toLocaleString("ru-RU")} sum` });
            return;
        }
        // Calculate discount amount
        let discountAmount = 0;
        if (promo.discountType === "percent") {
            discountAmount = Math.round(subtotal * Number(promo.discountValue) / 100);
        }
        else {
            discountAmount = Math.min(Number(promo.discountValue), subtotal);
        }
        res.json({
            valid: true,
            code: promo.code,
            discountType: promo.discountType,
            discountValue: Number(promo.discountValue),
            discountAmount,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Public analytics event ingestion (no auth required — client uses sessionId)
app.post("/api/analytics/event", async (req, res) => {
    const db = (await Promise.resolve().then(() => __importStar(require("./db/db")))).default;
    try {
        const VALID_TYPES = ["PRODUCT_VIEW", "ADD_TO_CART", "CHECKOUT_START", "ORDER_PLACED", "PAYMENT_SUCCESS"];
        const { eventType, sessionId, userId, productId, orderId, metadata } = req.body;
        if (!VALID_TYPES.includes(eventType)) {
            res.status(400).json({ error: "invalid eventType" });
            return;
        }
        await db.query(`INSERT INTO "AnalyticsEvent" (id,"eventType","sessionId","userId","productId","orderId",metadata,"createdAt")
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,NOW())`, [eventType, sessionId || null, userId || null, productId || null, orderId || null,
            metadata ? JSON.stringify(metadata) : null]);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
});
const PORT = process.env.PORT || 5000;
async function start() {
    try {
        await (0, migrate_1.runMigrations)();
        console.log("✓ Migrations applied");
    }
    catch (e) {
        console.error("Migration error:", e);
    }
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}
start();
exports.default = app;
