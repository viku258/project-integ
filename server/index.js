import { randomBytes } from "node:crypto";
import express from "express";
import { resolve } from "node:path";
import { openDatabase } from "./db.js";
import { createApp } from "./app.js";
const db = await openDatabase();
let password = process.env.ADMIN_PASSWORD;
if (!password && process.env.NODE_ENV === "production")
  throw new Error("Set ADMIN_PASSWORD in production.");
if (!password) {
  password = randomBytes(12).toString("base64url");
  console.log(`Temporary local admin password: ${password}`);
}
const app = createApp(db, {
  adminPassword: password,
  secureCookie: process.env.COOKIE_SECURE === "true",
});
if (process.env.NODE_ENV === "production") {
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const server = app.listen(
  process.env.PORT || 3000,
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(`Campus Bites: http://localhost:${process.env.PORT || 3000}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await db.close();
      process.exit(0);
    }),
  );
