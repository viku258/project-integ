import express from "express";
import {
  randomBytes,
  randomUUID,
  timingSafeEqual,
  createHash,
} from "node:crypto";

export function validateOrder(body, menu) {
  if (
    typeof body.customer !== "string" ||
    !body.customer.trim() ||
    body.customer.length > 80
  )
    throw new Error("Please enter your name (up to 80 characters).");
  if (typeof body.phone !== "string" || !/^[+\d ()-]{6,25}$/.test(body.phone))
    throw new Error("Please enter a valid phone number.");
  if (
    body.notes !== undefined &&
    (typeof body.notes !== "string" || body.notes.length > 500)
  )
    throw new Error("Notes must be under 500 characters.");
  if (
    !Array.isArray(body.items) ||
    !body.items.length ||
    body.items.length > 30
  )
    throw new Error("Your order must contain 1–30 items.");
  const seen = new Set();
  const items = body.items.map(({ id, quantity }) => {
    const item = menu.find((entry) => entry.id === id && entry.available === 1);
    if (
      !item ||
      seen.has(id) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 20
    )
      throw new Error(
        "An item is unavailable or has an invalid quantity (1–20).",
      );
    seen.add(id);
    return { id, name: item.name, price: item.price, quantity };
  });
  return {
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

export function createApp(db, { adminPassword, secureCookie = false } = {}) {
  if (!adminPassword) throw new Error("ADMIN_PASSWORD is required.");
  const app = express();
  const sessions = new Map(),
    attempts = new Map();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "same-origin",
      "Cache-Control": "no-store",
    });
    if (
      ["POST", "PATCH", "DELETE"].includes(req.method) &&
      req.headers.origin &&
      new URL(req.headers.origin).host !== req.headers.host
    )
      return res
        .status(403)
        .json({ error: "Cross-origin requests are not allowed." });
    next();
  });
  const cookie = (value, age) =>
    `session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${secureCookie ? "; Secure" : ""}`;
  const token = (req) =>
    req.headers.cookie
      ?.split("; ")
      .find((part) => part.startsWith("session="))
      ?.slice(8);
  function auth(req, res, next) {
    const expires = sessions.get(token(req));
    if (!expires || expires < Date.now())
      return res
        .status(401)
        .json({ error: "Please sign in as an administrator." });
    next();
  }
  app.get("/api/health", async (_req, res) => {
    await db.query("SELECT 1");
    res.json({ status: "ok" });
  });
  app.get("/api/menu", async (_req, res) =>
    res.json(await db.query("SELECT * FROM menu ORDER BY name")),
  );
  app.post("/api/orders", async (req, res) => {
    let validated;
    try {
      validated = validateOrder(req.body, await db.query("SELECT * FROM menu"));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    const id = randomUUID();
    await db.query(
      "INSERT INTO orders (id,customer,phone,notes,items,total,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        id,
        req.body.customer.trim(),
        req.body.phone,
        req.body.notes || "",
        JSON.stringify(validated.items),
        validated.total,
        "Received",
        new Date().toISOString(),
      ],
    );
    res.status(201).json({ id, ...validated, status: "Received" });
  });
  app.post("/api/admin/login", (req, res) => {
    const now = Date.now();
    for (const [key, value] of attempts)
      if (value.until < now) attempts.delete(key);
    for (const [key, value] of sessions) if (value < now) sessions.delete(key);
    const attempt = attempts.get(req.ip) || { count: 0, until: now + 900000 };
    if (attempt.count >= 10)
      return res
        .status(429)
        .json({ error: "Too many attempts. Try again in 15 minutes." });
    const digest = (value) => createHash("sha256").update(value).digest();
    if (
      typeof req.body.password !== "string" ||
      !timingSafeEqual(digest(req.body.password), digest(adminPassword))
    ) {
      attempt.count++;
      attempts.set(req.ip, attempt);
      return res.status(401).json({ error: "Incorrect password." });
    }
    attempts.delete(req.ip);
    const key = randomBytes(32).toString("hex");
    sessions.set(key, now + 28800000);
    res.setHeader("Set-Cookie", cookie(key, 28800));
    res.json({ ok: true });
  });
  app.post("/api/admin/logout", (req, res) => {
    sessions.delete(token(req));
    res.setHeader("Set-Cookie", cookie("", 0));
    res.json({ ok: true });
  });
  app.get("/api/admin/orders", auth, async (_req, res) =>
    res.json(
      (await db.query("SELECT * FROM orders ORDER BY created_at DESC")).map(
        (order) => ({ ...order, items: JSON.parse(order.items) }),
      ),
    ),
  );
  app.patch("/api/admin/orders/:id", auth, async (req, res) => {
    if (
      !["Received", "Preparing", "Ready", "Completed", "Cancelled"].includes(
        req.body.status,
      )
    )
      return res.status(400).json({ error: "Invalid order status." });
    const rows = await db.query(
      "UPDATE orders SET status=$1 WHERE id=$2 RETURNING id",
      [req.body.status, req.params.id],
    );
    res
      .status(rows.length ? 200 : 404)
      .json(rows.length ? { ok: true } : { error: "Order not found." });
  });
  app.post("/api/admin/menu", auth, async (req, res) => {
    const { name, description, category, price, emoji = "🍽️" } = req.body;
    if (
      ![name, description, category, emoji].every(
        (v) => typeof v === "string" && v.trim() && v.length <= 300,
      ) ||
      !Number.isInteger(price) ||
      price < 1 ||
      price > 100000
    )
      return res
        .status(400)
        .json({ error: "Provide valid item details and a price in cents." });
    const id = randomUUID();
    await db.query(
      "INSERT INTO menu (id,name,description,category,price,emoji) VALUES ($1,$2,$3,$4,$5,$6)",
      [id, name.trim(), description.trim(), category.trim(), price, emoji],
    );
    res.status(201).json({ id });
  });
  app.patch("/api/admin/menu/:id", auth, async (req, res) => {
    const { price, available } = req.body;
    if (
      !Number.isInteger(price) ||
      price < 1 ||
      price > 100000 ||
      ![0, 1].includes(available)
    )
      return res.status(400).json({ error: "Invalid price or availability." });
    const rows = await db.query(
      "UPDATE menu SET price=$1,available=$2 WHERE id=$3 RETURNING id",
      [price, available, req.params.id],
    );
    res
      .status(rows.length ? 200 : 404)
      .json(rows.length ? { ok: true } : { error: "Item not found." });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Endpoint not found." }),
  );
  app.use((error, _req, res, _next) => {
    console.error(error.message);
    res.status(error.status || 500).json({
      error:
        error.status === 400
          ? "Invalid JSON request."
          : "Something went wrong. Please try again.",
    });
  });
  return app;
}
