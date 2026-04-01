"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const db_1 = __importDefault(require("./db"));
async function runMigrations() {
    // SavedCard table
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS "SavedCard" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "maskedNumber" TEXT NOT NULL,
      brand TEXT,
      holder TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
    await db_1.default.query(`CREATE INDEX IF NOT EXISTS "SavedCard_userId_idx" ON "SavedCard"("userId")`);
    // Add type/series columns to Product if missing
    await db_1.default.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS type TEXT`);
    await db_1.default.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS series TEXT`);
    // PromoCode table
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS "PromoCode" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      code TEXT NOT NULL UNIQUE,
      "discountType" TEXT NOT NULL DEFAULT 'percent',
      "discountValue" NUMERIC NOT NULL DEFAULT 0,
      "minOrderAmount" NUMERIC NOT NULL DEFAULT 0,
      "usageLimit" INTEGER,
      "usageCount" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "expiresAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
    // AppSetting table
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS "AppSetting" (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
    // Seed default settings — single delivery fee, service fee
    await db_1.default.query(`
    INSERT INTO "AppSetting" (key, value, description) VALUES
      ('delivery_fee', '9900', 'Delivery fee in sum'),
      ('service_fee', '4990', 'Service fee in sum')
    ON CONFLICT (key) DO NOTHING
  `);
    // Remove old split delivery fee keys if they exist (migration to single fee)
    // Keep them if they exist — just don't seed duplicates
    // Add costPrice to ProductFlavor for profit analytics
    await db_1.default.query(`ALTER TABLE "ProductFlavor" ADD COLUMN IF NOT EXISTS "costPrice" INTEGER NOT NULL DEFAULT 0`);
    // AnalyticsEvent table for conversion funnel tracking
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      "eventType"  TEXT NOT NULL,
      "sessionId"  TEXT,
      "userId"     TEXT,
      "productId"  TEXT,
      "orderId"    TEXT,
      metadata     JSONB,
      "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
    await db_1.default.query(`CREATE INDEX IF NOT EXISTS "AnalyticsEvent_type_idx" ON "AnalyticsEvent"("eventType")`);
    await db_1.default.query(`CREATE INDEX IF NOT EXISTS "AnalyticsEvent_time_idx" ON "AnalyticsEvent"("createdAt")`);
    await db_1.default.query(`CREATE INDEX IF NOT EXISTS "AnalyticsEvent_sess_idx" ON "AnalyticsEvent"("sessionId")`);
    await db_1.default.query(`CREATE INDEX IF NOT EXISTS "AnalyticsEvent_user_idx" ON "AnalyticsEvent"("userId")`);
    // Add multilingual name columns to Category
    await db_1.default.query(`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameRu" TEXT`);
    await db_1.default.query(`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameUz" TEXT`);
    await db_1.default.query(`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameEn" TEXT`);
    // Backfill nameEn from existing name column
    await db_1.default.query(`UPDATE "Category" SET "nameEn" = name WHERE "nameEn" IS NULL`);
}
