import { Router, Response, Request } from "express";
import { requireAdmin, AuthRequest } from "../../middleware/auth";
import db from "../../db/db";

const router = Router();

// ─── SSE ─────────────────────────────────────────────────────────────────────
const sseClients = new Set<Response>();
export function broadcastSSE(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of sseClients) { try { c.write(msg); } catch { sseClients.delete(c); } }
}

router.get("/stream", (req: Request, res: Response) => {
  const token = (req.query?.token as string) || req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).end(); return; }
  try {
    const jwt = require("jsonwebtoken");
    const p   = jwt.verify(token, process.env.JWT_SECRET || "secret") as { role?: string };
    if (p.role !== "ADMIN" && p.role !== "SUPERADMIN") { res.status(403).end(); return; }
  } catch { res.status(401).end(); return; }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();
  res.write(`event: connected\ndata: {"ok":true}\n\n`);
  sseClients.add(res);
  const hb = setInterval(() => { try { res.write(`:hb\n\n`); } catch { clearInterval(hb); } }, 25000);
  req.on("close", () => { clearInterval(hb); sseClients.delete(res); });
});

router.use(requireAdmin as any);

// ─── Timezone helpers ─────────────────────────────────────────────────────────
//
// DATABASE SETUP (from db.ts):
//   - pool.on("connect") runs SET timezone = 'UTC'
//   - types.setTypeParser(1114) appends 'Z' to raw TIMESTAMP strings
//   - Therefore: o."createdAt" is a TIMESTAMP WITHOUT TIME ZONE storing UTC values
//
// CONVERSION RULES:
//   tsCol  = TIMESTAMP WITHOUT TIME ZONE (e.g. o."createdAt") -> stored as UTC
//   tstzEx = TIMESTAMPTZ expression (e.g. NOW(), generate_series output)
//
//   For TIMESTAMP WITHOUT TZ columns (tsCol):
//     tsCol AT TIME ZONE 'UTC'                -> marks it as UTC -> returns TIMESTAMPTZ
//     then AT TIME ZONE 'Asia/Tashkent'        -> converts to Tashkent local time -> TIMESTAMP
//     Shorthand: tsCol::timestamptz AT TIME ZONE 'Asia/Tashkent'
//                (::timestamptz uses session TZ=UTC to interpret the bare timestamp)
//     Both are equivalent. We use the explicit form for clarity.
//
//   For TIMESTAMPTZ expressions (tstzEx, e.g. NOW(), generate_series(NOW(),...)):
//     tstzEx AT TIME ZONE 'Asia/Tashkent'      -> direct conversion -> TIMESTAMP in Tashkent
//     Do NOT use the two-step form on TIMESTAMPTZ as it adds confusion.
//
const TZ = "Asia/Tashkent";

// For TIMESTAMP WITHOUT TZ columns (o."createdAt" etc.) stored as UTC
const tsToTZ   = (col: string) => `(${col} AT TIME ZONE 'UTC' AT TIME ZONE '${TZ}')`;

// For TIMESTAMPTZ expressions (NOW(), generate_series output)
const tstzToTZ = (expr: string) => `(${expr} AT TIME ZONE '${TZ}')`;

// ─── Range config ─────────────────────────────────────────────────────────────
type RangeCfg = {
  where:        string;
  chartSql:     string;
  statusSql:    string;
  intervalDays: number;
  labelHint:    "hour" | "day" | "month";
};

function getRangeConfig(range: string): RangeCfg {
  // Today: gap-fill all 24 Tashkent hours using integer series (avoids TIMESTAMPTZ complexity)
  // The LEFT JOIN condition converts createdAt to Tashkent hour for grouping.
  const todayInTZ = `(CURRENT_TIMESTAMP AT TIME ZONE '${TZ}')::date`;
  const orderDateTZ = `DATE(${tsToTZ('o."createdAt"')})`;

  switch (range) {
    case "day": return {
      where:    `AND ${orderDateTZ} = ${todayInTZ}`,
      chartSql: `
        WITH hours AS (SELECT generate_series(0, 23) AS h)
        SELECT
          LPAD(h::text, 2, '0')                               AS period,
          COALESCE(SUM(o."totalAmount"), 0)                   AS revenue,
          COUNT(o.id)                                         AS orders
        FROM hours
        LEFT JOIN "Order" o
          ON  TO_CHAR(${tsToTZ('o."createdAt"')}, 'HH24')::int = h
          AND ${orderDateTZ} = ${todayInTZ}
          AND o.status NOT IN ('CANCELLED','REFUNDED')
        GROUP BY h ORDER BY h ASC`,
      statusSql:    `WHERE ${orderDateTZ} = ${todayInTZ}`,
      intervalDays: 1,
      labelHint:    "hour",
    };
    case "week": return {
      where:    `AND o."createdAt" >= NOW() - INTERVAL '7 days'`,
      chartSql: `
        SELECT TO_CHAR(DATE(${tsToTZ('o."createdAt"')}), 'YYYY-MM-DD') AS period,
          COALESCE(SUM(o."totalAmount"),0) AS revenue, COUNT(*) AS orders
        FROM "Order" o
        WHERE o."createdAt" >= NOW() - INTERVAL '7 days'
          AND o.status NOT IN ('CANCELLED','REFUNDED')
        GROUP BY DATE(${tsToTZ('o."createdAt"')}) ORDER BY period ASC`,
      statusSql:    `WHERE o."createdAt" >= NOW() - INTERVAL '7 days'`,
      intervalDays: 7,
      labelHint:    "day",
    };
    case "month": return {
      where:    `AND o."createdAt" >= NOW() - INTERVAL '30 days'`,
      chartSql: `
        SELECT TO_CHAR(DATE(${tsToTZ('o."createdAt"')}), 'YYYY-MM-DD') AS period,
          COALESCE(SUM(o."totalAmount"),0) AS revenue, COUNT(*) AS orders
        FROM "Order" o
        WHERE o."createdAt" >= NOW() - INTERVAL '30 days'
          AND o.status NOT IN ('CANCELLED','REFUNDED')
        GROUP BY DATE(${tsToTZ('o."createdAt"')}) ORDER BY period ASC`,
      statusSql:    `WHERE o."createdAt" >= NOW() - INTERVAL '30 days'`,
      intervalDays: 30,
      labelHint:    "day",
    };
    case "year": return {
      where:    `AND o."createdAt" >= NOW() - INTERVAL '365 days'`,
      chartSql: `
        SELECT TO_CHAR(DATE_TRUNC('month', ${tsToTZ('o."createdAt"')}), 'YYYY-MM') AS period,
          COALESCE(SUM(o."totalAmount"),0) AS revenue, COUNT(*) AS orders
        FROM "Order" o
        WHERE o."createdAt" >= NOW() - INTERVAL '365 days'
          AND o.status NOT IN ('CANCELLED','REFUNDED')
        GROUP BY DATE_TRUNC('month', ${tsToTZ('o."createdAt"')}) ORDER BY period ASC`,
      statusSql:    `WHERE o."createdAt" >= NOW() - INTERVAL '365 days'`,
      intervalDays: 365,
      labelHint:    "month",
    };
    default: return {
      where:    "",
      chartSql: `
        SELECT TO_CHAR(DATE_TRUNC('month', ${tsToTZ('o."createdAt"')}), 'YYYY-MM') AS period,
          COALESCE(SUM(o."totalAmount"),0) AS revenue, COUNT(*) AS orders
        FROM "Order" o
        WHERE o.status NOT IN ('CANCELLED','REFUNDED')
        GROUP BY DATE_TRUNC('month', ${tsToTZ('o."createdAt"')}) ORDER BY period ASC`,
      statusSql:    `WHERE 1=1`,
      intervalDays: 36500,
      labelHint:    "month",
    };
  }
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const range = (req.query.range as string) || "all";
    const cfg   = getRangeConfig(range);

    const [usersR, ordersR, revenueR, chartR, statusR, rtAggR, rtChartR, rtTopR] =
      await Promise.all([
        db.query(`SELECT COUNT(*) FROM "User" WHERE role = 'USER'`),
        db.query(`SELECT COUNT(*), status FROM "Order" o WHERE 1=1 ${cfg.where} GROUP BY status`),
        db.query(`
          SELECT
            COALESCE(SUM(o."totalAmount"),0)    AS total,
            COALESCE(SUM(o."subtotalAmount"),0) AS subtotal,
            COALESCE(SUM(o."discountAmount"),0) AS discount,
            COALESCE(SUM(o."deliveryFee"),0)    AS delivery
          FROM "Order" o
          WHERE o.status NOT IN ('CANCELLED','REFUNDED') ${cfg.where}`),
        db.query(cfg.chartSql),
        db.query(`SELECT o.status, COUNT(*) AS count FROM "Order" o ${cfg.statusSql} GROUP BY o.status`),

        // ── Realtime 48h aggregate ──────────────────────────────────────────────
        // Filter uses explicit UTC cast so comparison with NOW() is unambiguous
        // regardless of session timezone or server timezone settings.
        // (o."createdAt" AT TIME ZONE 'UTC') casts TIMESTAMP WITHOUT TZ -> TIMESTAMPTZ(UTC),
        // then >= NOW()-48h compares two TIMESTAMPTZ values — always correct.
        db.query(`
          SELECT
            COUNT(DISTINCT o.id)             AS orders,
            COALESCE(SUM(o."totalAmount"),0) AS revenue,
            COALESCE(SUM(oi.quantity),0)     AS items_sold,
            COUNT(DISTINCT o."userId")       AS unique_buyers
          FROM "Order" o
          LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
          WHERE (o."createdAt" AT TIME ZONE 'UTC') >= NOW() - INTERVAL '48 hours'
            AND o.status NOT IN ('CANCELLED','REFUNDED')
        `),

        // ── Realtime 48h hourly chart (Tashkent-native approach) ──────────────
        //
        // Strategy: generate integer slots 0..47 (0=now, 47=oldest).
        // For each slot, compute the Tashkent timestamp by subtracting n hours from NOW()
        // and converting to Tashkent. The slot's "bucket key" is (tashkent_date, tashkent_hour)
        // — pure integers, zero TIMESTAMPTZ ambiguity.
        //
        // Orders are grouped by their Tashkent (date, hour) pair using the same conversion.
        // JOIN on (date, hour) integers is always unambiguous.
        //
        // Period label format: 'YYYY-MM-DD HH24' in Tashkent — matches fmtPeriodLabel("hour").
        //
        // tsToTZ(col) = col AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tashkent'
        //   This converts a TIMESTAMP WITHOUT TZ column (stored UTC) to Tashkent local TIMESTAMP.
        //   The double AT TIME ZONE is correct: first marks it as UTC (returns TIMESTAMPTZ),
        //   then converts to Tashkent (returns TIMESTAMP in Tashkent local time).
        //
        // For the slot generation, NOW() - n*interval is pure TIMESTAMPTZ arithmetic,
        // then AT TIME ZONE 'Asia/Tashkent' converts absolute time to Tashkent local.
        db.query(`
          WITH
          -- Generate 48 integer slots: 0 = current hour, 47 = oldest hour
          slots AS (
            SELECT generate_series(0, 47) AS n
          ),
          -- For each slot, compute the Tashkent local time of that hour boundary
          slot_times AS (
            SELECT
              n,
              (NOW() - (n || ' hours')::interval) AT TIME ZONE 'Asia/Tashkent' AS tz_ts
            FROM slots
          ),
          -- Extract Tashkent date + hour as the bucket key for each slot
          slot_buckets AS (
            SELECT
              n,
              (tz_ts::date)::text                                  AS tz_date,
              EXTRACT(HOUR FROM tz_ts)::int                        AS tz_hour,
              TO_CHAR(DATE_TRUNC('hour', tz_ts), 'YYYY-MM-DD HH24') AS period
            FROM slot_times
          ),
          -- Group real orders by their Tashkent (date, hour) bucket
          order_buckets AS (
            SELECT
              (${tsToTZ('o."createdAt"')}::date)::text              AS tz_date,
              EXTRACT(HOUR FROM ${tsToTZ('o."createdAt"')})::int    AS tz_hour,
              COUNT(DISTINCT o.id)                                   AS orders,
              COALESCE(SUM(o."totalAmount"), 0)                      AS revenue
            FROM "Order" o
            WHERE (o."createdAt" AT TIME ZONE 'UTC') >= NOW() - INTERVAL '49 hours'
              AND o.status NOT IN ('CANCELLED','REFUNDED')
            GROUP BY (${tsToTZ('o."createdAt"')}::date)::text,
                     EXTRACT(HOUR FROM ${tsToTZ('o."createdAt"')})::int
          )
          SELECT
            sb.period,
            COALESCE(ob.orders,  0) AS orders,
            COALESCE(ob.revenue, 0) AS revenue
          FROM slot_buckets sb
          LEFT JOIN order_buckets ob
            ON ob.tz_date = sb.tz_date AND ob.tz_hour = sb.tz_hour
          ORDER BY sb.n DESC  -- slot 47 first (oldest), slot 0 last (newest) = chronological
        `),

        // ── Realtime top 3 flavors last 48h ────────────────────────────────────
        db.query(`
          SELECT
            p.name                                    AS product_name,
            COALESCE(pf."flavorName", pf."flavorKey") AS flavor_name,
            pf."imageUrl"                             AS image_url,
            SUM(oi.quantity)                          AS qty
          FROM "OrderItem" oi
          JOIN "Order"         o  ON o.id   = oi."orderId"
          JOIN "ProductFlavor" pf ON pf.id  = oi."flavorId"
          JOIN "Product"       p  ON p.id   = pf."productId"
          WHERE (o."createdAt" AT TIME ZONE 'UTC') >= NOW() - INTERVAL '48 hours'
            AND o.status NOT IN ('CANCELLED','REFUNDED')
          GROUP BY p.name, pf."flavorName", pf."flavorKey", pf."imageUrl"
          ORDER BY qty DESC
          LIMIT 3
        `),
      ]);

    const ordersByStatus: Record<string, number> = {};
    for (const r of ordersR.rows) ordersByStatus[r.status] = Number(r.count);
    const statusDist: Record<string, number> = {};
    for (const r of statusR.rows) statusDist[r.status] = Number(r.count);

    const rev          = revenueR.rows[0];
    const rtAgg        = rtAggR.rows[0];
    const totalOrders  = Object.values(ordersByStatus).reduce((a: number, b) => a + (b as number), 0);
    const totalRevenue = Number(rev.total);
    const rtOrders     = Number(rtAgg.orders);

    const missing: string[] = [];
    if (Number(usersR.rows[0].count) === 0)
      missing.push("no_users: No users registered yet");
    if (totalOrders === 0)
      missing.push(`no_orders: No orders in selected range (${range})`);
    if (totalRevenue === 0 && totalOrders > 0)
      missing.push("no_revenue: Orders exist but revenue is 0");
    if (rtOrders === 0)
      missing.push("no_realtime: No orders in the last 48 hours");
    if (rtTopR.rows.length === 0)
      missing.push("no_realtime_products: No product sales in last 48 hours");

    res.json({
      totalUsers:      Number(usersR.rows[0].count),
      totalOrders,
      revenue:         { total: totalRevenue, subtotal: Number(rev.subtotal), discount: Number(rev.discount), delivery: Number(rev.delivery) },
      totalRevenue,
      ordersByStatus,
      orderStatusDist: statusDist,
      revenueChart:    chartR.rows.map((r: any) => ({ period: r.period, revenue: Number(r.revenue), orders: Number(r.orders) })),
      labelHint:       cfg.labelHint,
      realtime: {
        orders:       rtOrders,
        revenue:      Number(rtAgg.revenue),
        itemsSold:    Number(rtAgg.items_sold),
        uniqueBuyers: Number(rtAgg.unique_buyers),
        chart: rtChartR.rows.map((r: any) => ({
          period:  r.period,
          orders:  Number(r.orders),
          revenue: Number(r.revenue),
        })),
        topProducts: rtTopR.rows.map((r: any) => ({
          name:       r.product_name,
          flavorName: r.flavor_name,
          imageUrl:   r.image_url,
          qty:        Number(r.qty),
        })),
      },
      missing,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── RECENT ORDERS ────────────────────────────────────────────────────────────
router.get("/recent-orders", async (_req: AuthRequest, res: Response) => {
  try {
    // Return raw createdAt as UTC ISO - frontend formats to Tashkent TZ
    const r = await db.query(`
      SELECT o.id, o.status, o."totalAmount", o."createdAt",
             u.phone, u."fullName"
      FROM "Order" o
      JOIN "User" u ON u.id = o."userId"
      ORDER BY o."createdAt" DESC LIMIT 8
    `);
    res.json(r.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── RECENT USERS ─────────────────────────────────────────────────────────────
router.get("/recent-users", async (_req: AuthRequest, res: Response) => {
  try {
    const r = await db.query(`
      SELECT id, phone, "fullName", role, "createdAt"
      FROM "User"
      WHERE role != 'SUPERADMIN'
      ORDER BY "createdAt" DESC LIMIT 10
    `);
    res.json(r.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── PRODUCTS ANALYTICS (FLAVOR / VARIANT LEVEL) ─────────────────────────────
// Groups by ProductFlavor.id - each row is ONE specific variant.
// This prevents the old product-level aggregation which hid per-flavor performance.
// No duplicate rows possible since GROUP BY pf.id is a primary key.
router.get("/products-analytics", async (req: AuthRequest, res: Response) => {
  try {
    const range = (req.query.range as string) || "all";
    const cfg   = getRangeConfig(range);
    const days  = cfg.intervalDays;
    const prev  = days * 2;

    const [flavorsR, summaryR, timeChartR, categoryR, insightsR, flavorDeclR, catLowR, funnelR] =
      await Promise.all([

        // Per-flavor breakdown - one row per variant, no duplicates
        db.query(`
          SELECT
            pf.id                                                              AS "flavorId",
            p.name                                                             AS "productName",
            COALESCE(pf."flavorName", pf."flavorKey")                         AS "flavorName",
            pf."imageUrl"                                                      AS "imageUrl",
            COUNT(DISTINCT o.id)                                               AS purchases,
            SUM(oi.quantity)                                                   AS "totalQty",
            COALESCE(SUM(CAST(oi."unitPrice" AS BIGINT) * oi.quantity), 0)    AS revenue,
            COALESCE(SUM(CAST(COALESCE(pf."costPrice",0) AS BIGINT) * oi.quantity), 0) AS cost,
            AVG(oi."unitPrice")                                                AS "avgPrice"
          FROM "OrderItem" oi
          JOIN "Order"         o  ON o.id   = oi."orderId"
          JOIN "ProductFlavor" pf ON pf.id  = oi."flavorId"
          JOIN "Product"       p  ON p.id   = pf."productId"
          WHERE o.status NOT IN ('CANCELLED','REFUNDED')
            AND o."createdAt" >= NOW() - INTERVAL '${days} days'
          GROUP BY pf.id, p.name, pf."flavorName", pf."flavorKey", pf."imageUrl"
          ORDER BY purchases DESC
          LIMIT 50
        `),

        // Summary - same period, overall totals
        db.query(`
          SELECT
            COUNT(DISTINCT o.id)                                                         AS total_orders,
            COALESCE(SUM(CAST(oi."unitPrice" AS BIGINT) * oi.quantity), 0)               AS total_revenue,
            COALESCE(SUM(CAST(COALESCE(pf."costPrice",0) AS BIGINT) * oi.quantity), 0)  AS total_cost,
            COALESCE(SUM(oi.quantity), 0)                                                AS total_items,
            COUNT(DISTINCT o."userId")                                                   AS unique_buyers,
            COALESCE(AVG(o."totalAmount"), 0)                                            AS avg_order_value
          FROM "OrderItem" oi
          JOIN "Order"         o  ON o.id  = oi."orderId"
          JOIN "ProductFlavor" pf ON pf.id = oi."flavorId"
          WHERE o.status NOT IN ('CANCELLED','REFUNDED')
            AND o."createdAt" >= NOW() - INTERVAL '${days} days'
        `),

        // Time chart - grouped by range, Tashkent timezone for display
        db.query(`
          SELECT
            ${cfg.labelHint === "hour"
              ? `TO_CHAR(${tsToTZ('o."createdAt"')}, 'HH24')`
              : cfg.labelHint === "month"
              ? `TO_CHAR(DATE_TRUNC('month', ${tsToTZ('o."createdAt"')}), 'YYYY-MM')`
              : `TO_CHAR(DATE(${tsToTZ('o."createdAt"')}), 'YYYY-MM-DD')`
            } AS period,
            COUNT(DISTINCT o.id) AS orders,
            SUM(oi.quantity)     AS items
          FROM "OrderItem" oi
          JOIN "Order" o ON o.id = oi."orderId"
          WHERE o.status NOT IN ('CANCELLED','REFUNDED')
            AND o."createdAt" >= NOW() - INTERVAL '${days} days'
          GROUP BY 1 ORDER BY 1 ASC
        `),

        // Category revenue breakdown
        db.query(`
          SELECT cat.name AS category,
            COALESCE(SUM(CAST(oi."unitPrice" AS BIGINT) * oi.quantity), 0) AS revenue,
            COUNT(DISTINCT o.id)                                            AS purchases
          FROM "OrderItem" oi
          JOIN "Order"         o   ON o.id   = oi."orderId"
          JOIN "ProductFlavor" pf  ON pf.id  = oi."flavorId"
          JOIN "Product"       p   ON p.id   = pf."productId"
          JOIN "Category"      cat ON cat.id = p."categoryId"
          WHERE o.status NOT IN ('CANCELLED','REFUNDED')
            AND o."createdAt" >= NOW() - INTERVAL '${days} days'
          GROUP BY cat.name ORDER BY revenue DESC
        `),

        // Period vs previous period for insights
        db.query(`
          SELECT
            COALESCE(SUM(CASE WHEN o."createdAt" >= NOW() - INTERVAL '${days} days'
              THEN o."totalAmount" END), 0) AS cur_revenue,
            COALESCE(SUM(CASE WHEN o."createdAt" < NOW() - INTERVAL '${days} days'
              AND  o."createdAt" >= NOW() - INTERVAL '${prev} days'
              THEN o."totalAmount" END), 0) AS prev_revenue,
            COUNT(CASE WHEN o."createdAt" >= NOW() - INTERVAL '${days} days' THEN 1 END) AS cur_orders,
            COUNT(CASE WHEN o."createdAt" <  NOW() - INTERVAL '${days} days'
              AND  o."createdAt" >= NOW() - INTERVAL '${prev} days' THEN 1 END)           AS prev_orders,
            COUNT(DISTINCT CASE WHEN o."createdAt" >= NOW() - INTERVAL '${days} days'
              THEN o."userId" END)                                                         AS cur_buyers,
            COUNT(DISTINCT CASE WHEN o."createdAt" <  NOW() - INTERVAL '${days} days'
              AND  o."createdAt" >= NOW() - INTERVAL '${prev} days'
              THEN o."userId" END)                                                         AS prev_buyers
          FROM "Order" o
          WHERE o.status NOT IN ('CANCELLED','REFUNDED')
            AND o."createdAt" >= NOW() - INTERVAL '${prev} days'
        `),

        // Most declining flavor (worst units drop)
        db.query(`
          SELECT
            p.name                                      AS product_name,
            COALESCE(pf."flavorName", pf."flavorKey")  AS flavor_name,
            COALESCE(SUM(CASE WHEN o."createdAt" >= NOW() - INTERVAL '${days} days'
              THEN oi.quantity END), 0) AS cur_qty,
            COALESCE(SUM(CASE WHEN o."createdAt" <  NOW() - INTERVAL '${days} days'
              AND  o."createdAt" >= NOW() - INTERVAL '${prev} days'
              THEN oi.quantity END), 0) AS prev_qty
          FROM "OrderItem" oi
          JOIN "Order"         o  ON o.id  = oi."orderId"
          JOIN "ProductFlavor" pf ON pf.id = oi."flavorId"
          JOIN "Product"       p  ON p.id  = pf."productId"
          WHERE o.status NOT IN ('CANCELLED','REFUNDED')
            AND o."createdAt" >= NOW() - INTERVAL '${prev} days'
          GROUP BY p.name, pf."flavorName", pf."flavorKey"
          HAVING COALESCE(SUM(CASE WHEN o."createdAt" >= NOW() - INTERVAL '${days} days'
                              THEN oi.quantity ELSE 0 END), 0)
               < COALESCE(SUM(CASE WHEN o."createdAt" <  NOW() - INTERVAL '${days} days'
                              AND  o."createdAt" >= NOW() - INTERVAL '${prev} days'
                              THEN oi.quantity ELSE 0 END), 0)
          ORDER BY (
            COALESCE(SUM(CASE WHEN o."createdAt" >= NOW() - INTERVAL '${days} days'
              THEN oi.quantity ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN o."createdAt" <  NOW() - INTERVAL '${days} days'
              AND  o."createdAt" >= NOW() - INTERVAL '${prev} days'
              THEN oi.quantity ELSE 0 END), 0)
          ) ASC
          LIMIT 1
        `),

        // Lowest revenue category
        db.query(`
          SELECT cat.name,
            COALESCE(SUM(CAST(oi."unitPrice" AS BIGINT) * oi.quantity), 0) AS revenue,
            COUNT(DISTINCT o.id)                                            AS purchases
          FROM "OrderItem" oi
          JOIN "Order"         o   ON o.id   = oi."orderId"
          JOIN "ProductFlavor" pf  ON pf.id  = oi."flavorId"
          JOIN "Product"       p   ON p.id   = pf."productId"
          JOIN "Category"      cat ON cat.id = p."categoryId"
          WHERE o.status NOT IN ('CANCELLED','REFUNDED')
            AND o."createdAt" >= NOW() - INTERVAL '${days} days'
          GROUP BY cat.name ORDER BY revenue ASC LIMIT 1
        `),

        // Conversion funnel from AnalyticsEvent records
        db.query(`
          SELECT "eventType", COUNT(*) AS cnt
          FROM "AnalyticsEvent"
          WHERE "createdAt" >= NOW() - INTERVAL '${days} days'
          GROUP BY "eventType"
        `),
      ]);

    const sm           = summaryR.rows[0];
    const ins          = insightsR.rows[0];
    const totalRevenue = Number(sm.total_revenue);
    const totalCost    = Number(sm.total_cost);
    const hasProfit    = totalCost > 0;

    // One row per flavor - GROUP BY pf.id ensures no duplicates
    const flavors = flavorsR.rows.map((r: any) => {
      const rev  = Number(r.revenue);
      const cost = Number(r.cost);
      return {
        flavorId:     r.flavorId,
        productName:  r.productName,
        flavorName:   r.flavorName,
        imageUrl:     r.imageUrl,
        purchases:    Number(r.purchases),
        totalQty:     Number(r.totalQty),
        revenue:      rev,
        cost,
        profit:       hasProfit ? rev - cost : null,
        avgPrice:     Math.round(Number(r.avgPrice)),
        revenueShare: totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0,
      };
    });

    // Build insights from real comparison data
    const insights: { type: string; title: string; body: string; positive?: boolean }[] = [];
    const curRev  = Number(ins.cur_revenue);
    const prevRev = Number(ins.prev_revenue);
    const curOrd  = Number(ins.cur_orders);
    const prevOrd = Number(ins.prev_orders);
    const curBuy  = Number(ins.cur_buyers);
    const prevBuy = Number(ins.prev_buyers);

    if (prevRev > 0 && curRev > 0) {
      const pct = Math.round(((curRev - prevRev) / prevRev) * 100);
      insights.push({
        type: "revenue", positive: pct >= 0,
        title: pct >= 0 ? `Revenue up ${pct}%` : `Revenue down ${Math.abs(pct)}%`,
        body: `${curRev.toLocaleString("ru-RU")} sum vs ${prevRev.toLocaleString("ru-RU")} sum prev period`,
      });
    }
    if (categoryR.rows.length > 0) {
      const top = categoryR.rows[0];
      insights.push({
        type: "top_category", positive: true,
        title: `Best category: ${top.category}`,
        body: `${Number(top.revenue).toLocaleString("ru-RU")} sum - ${Number(top.purchases)} orders`,
      });
    }
    if (flavors.length > 0) {
      const f = flavors[0];
      insights.push({
        type: "top_flavor", positive: true,
        title: `Top variant: ${f.productName} - ${f.flavorName}`,
        body: `${f.purchases} orders - ${f.revenue.toLocaleString("ru-RU")} sum`,
      });
    }
    if (prevOrd > 0 && curOrd < prevOrd) {
      const pct = Math.round(((prevOrd - curOrd) / prevOrd) * 100);
      insights.push({
        type: "orders_drop", positive: false,
        title: `Orders down ${pct}% vs previous period`,
        body: `${curOrd} orders now vs ${prevOrd} previous period`,
      });
    } else if (prevOrd > 0 && curOrd > prevOrd) {
      const pct = Math.round(((curOrd - prevOrd) / prevOrd) * 100);
      insights.push({
        type: "orders_up", positive: true,
        title: `Orders up ${pct}% vs previous period`,
        body: `${curOrd} orders now vs ${prevOrd} previous period`,
      });
    }
    if (flavorDeclR.rows.length > 0) {
      const dp   = flavorDeclR.rows[0];
      const drop = Number(dp.prev_qty) - Number(dp.cur_qty);
      insights.push({
        type: "flavor_decline", positive: false,
        title: `Declining: ${dp.product_name} - ${dp.flavor_name}`,
        body: `Sales dropped by ${drop} units vs previous period`,
      });
    }
    if (catLowR.rows.length > 0 && categoryR.rows.length > 1) {
      const lc = catLowR.rows[0];
      insights.push({
        type: "low_category", positive: false,
        title: `Low category: ${lc.name}`,
        body: `Only ${Number(lc.purchases)} orders - ${Number(lc.revenue).toLocaleString("ru-RU")} sum`,
      });
    }
    if (prevBuy > 0 && curBuy > 0 && curBuy !== prevBuy) {
      const pct = Math.round(((curBuy - prevBuy) / prevBuy) * 100);
      insights.push({
        type: "buyers", positive: pct >= 0,
        title: pct >= 0 ? `Buyers up ${pct}%` : `Buyers down ${Math.abs(pct)}%`,
        body: `${curBuy} unique buyers vs ${prevBuy} previous period`,
      });
    }

    const funnelMap: Record<string, number> = {};
    for (const row of funnelR.rows) funnelMap[row.eventType] = Number(row.cnt);
    const funnel = {
      PRODUCT_VIEW:    funnelMap["PRODUCT_VIEW"]    || 0,
      ADD_TO_CART:     funnelMap["ADD_TO_CART"]     || 0,
      CHECKOUT_START:  funnelMap["CHECKOUT_START"]  || 0,
      ORDER_PLACED:    funnelMap["ORDER_PLACED"]    || 0,
      PAYMENT_SUCCESS: funnelMap["PAYMENT_SUCCESS"] || 0,
      hasRealData:     Object.values(funnelMap).some((v) => v > 0),
    };

    const missing: string[] = [];
    if (flavors.length === 0)
      missing.push("no_flavor_sales: No order items for this period");
    if (categoryR.rows.length === 0)
      missing.push("no_category_data: No category-linked orders found");
    if (timeChartR.rows.length === 0)
      missing.push("no_time_chart: No time-series data for this period");
    if (!hasProfit)
      missing.push("no_cost_price: costPrice is 0 on all variants - set via Admin > Products to enable profit");
    if (!funnel.hasRealData)
      missing.push("no_funnel_events: No AnalyticsEvent records yet");
    if (insights.length < 2)
      missing.push("low_insights: Need orders in both current and previous period for comparison insights");

    res.json({
      summary: {
        totalOrders:   Number(sm.total_orders),
        totalRevenue,
        totalCost,
        profit:        hasProfit ? totalRevenue - totalCost : null,
        totalItems:    Number(sm.total_items),
        uniqueBuyers:  Number(sm.unique_buyers),
        avgOrderValue: Math.round(Number(sm.avg_order_value)),
      },
      missing,
      products: flavors,   // "products" key kept for API compat; each row is a flavor
      timeChart:     timeChartR.rows.map((r: any) => ({ period: r.period, orders: Number(r.orders), items: Number(r.items) })),
      categoryChart: categoryR.rows.map((r: any) => ({ category: r.category, revenue: Number(r.revenue), purchases: Number(r.purchases) })),
      insights,
      funnel,
      labelHint: cfg.labelHint,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── APP SETTINGS ─────────────────────────────────────────────────────────────
router.get("/settings", async (_req: AuthRequest, res: Response) => {
  try {
    const r = await db.query(`SELECT key, value FROM "AppSetting" ORDER BY key`);
    const s: Record<string, string> = {};
    for (const row of r.rows) s[row.key] = row.value;
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.patch("/settings", async (req: AuthRequest, res: Response) => {
  try {
    const { settings } = req.body as { settings: Record<string, string> };
    if (!settings) { res.status(400).json({ error: "settings required" }); return; }
    for (const [k, v] of Object.entries(settings)) {
      await db.query(
        `INSERT INTO "AppSetting"(key,value,"updatedAt") VALUES($1,$2,NOW())
         ON CONFLICT(key) DO UPDATE SET value=$2,"updatedAt"=NOW()`,
        [k, String(v)]
      );
    }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── PROMO CODES ──────────────────────────────────────────────────────────────
router.get("/promo-codes", async (_req: AuthRequest, res: Response) => {
  try { res.json((await db.query(`SELECT * FROM "PromoCode" ORDER BY "createdAt" DESC`)).rows); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post("/promo-codes", async (req: AuthRequest, res: Response) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, usageLimit, isActive, expiresAt } = req.body;
    if (!code || !discountType || discountValue === undefined)
      { res.status(400).json({ error: "required fields missing" }); return; }
    const r = await db.query(
      `INSERT INTO "PromoCode"(id,code,"discountType","discountValue","minOrderAmount","usageLimit","isActive","expiresAt")
       VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [code.toUpperCase(), discountType, Number(discountValue),
       minOrderAmount ? Number(minOrderAmount) : 0,
       usageLimit     ? Number(usageLimit)     : null,
       isActive ?? true, expiresAt || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});
router.patch("/promo-codes/:id", async (req: AuthRequest, res: Response) => {
  try {
    const fields: string[] = []; const vals: any[] = []; let i = 1;
    for (const k of ["code","discountType","discountValue","minOrderAmount","usageLimit","isActive","expiresAt"]) {
      if (req.body[k] !== undefined) {
        fields.push(`"${k}"=$${i++}`);
        vals.push(k === "code" ? String(req.body[k]).toUpperCase() : req.body[k]);
      }
    }
    if (!fields.length) { res.status(400).json({ error: "nothing to update" }); return; }
    vals.push(req.params.id);
    res.json((await db.query(
      `UPDATE "PromoCode" SET ${fields.join(",")}, "updatedAt"=NOW() WHERE id=$${i} RETURNING *`, vals
    )).rows[0]);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});
router.delete("/promo-codes/:id", async (req: AuthRequest, res: Response) => {
  try { await db.query(`DELETE FROM "PromoCode" WHERE id=$1`, [req.params.id]); res.json({ success: true }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── BROADCAST NOTIFICATION ───────────────────────────────────────────────────
router.post("/notify", async (req: AuthRequest, res: Response) => {
  try {
    const { type = "INFO", title, message, userIds } = req.body;
    if (!title?.trim() || !message?.trim())
      { res.status(400).json({ error: "title and message required" }); return; }
    const nt  = ["INFO","ORDER","PROMO","SYSTEM"].includes(type) ? type : "INFO";
    const ids: string[] = userIds?.length
      ? userIds
      : (await db.query(`SELECT id FROM "User" WHERE "isBlocked"=false`)).rows.map((r: any) => r.id);
    if (!ids.length) { res.json({ sent: 0 }); return; }
    const vals   = ids.map((_: any, j: number) =>
      `(gen_random_uuid(),$${j*3+1},$${j*3+2},$${j*3+3},'${nt}',false,NOW(),NOW())`).join(",");
    const params: string[] = [];
    for (const id of ids) params.push(id, title.trim(), message.trim());
    await db.query(
      `INSERT INTO "Notification"(id,"userId",title,message,type,"isRead","createdAt","updatedAt") VALUES ${vals}`,
      params
    );
    broadcastSSE("notification", { count: ids.length });
    res.json({ sent: ids.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
