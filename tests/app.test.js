import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../server/db.js";
import { createApp } from "../server/app.js";
let db, server, base, cookie;
before(async () => {
  db = await openDatabase(process.env.TEST_DATABASE_URL || "", ":memory:");
  server = createApp(db, { adminPassword: "test-password" }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
});
async function request(path, method = "GET", body, session) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Cookie: session } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie"),
  };
}
test("menu and database health are available", async () => {
  assert.equal((await request("/health")).data.status, "ok");
  assert.ok((await request("/menu")).data.length >= 8);
});
test("ordering uses server prices and persists the exact order", async () => {
  const result = await request("/orders", "POST", {
    customer: "Taha",
    phone: "12345678",
    items: [{ id: "burger", quantity: 2, price: 1 }],
    total: 1,
  });
  assert.equal(result.status, 201);
  assert.equal(result.data.total, 2500);
  const rows = await db.query("SELECT * FROM orders WHERE id=$1", [
    result.data.id,
  ]);
  assert.equal(rows[0].total, 2500);
  assert.equal(JSON.parse(rows[0].items)[0].quantity, 2);
});
test("rejects empty, duplicate, unavailable, unknown and invalid quantity orders", async () => {
  for (const items of [
    [],
    [{ id: "burger", quantity: 0 }],
    [{ id: "burger", quantity: 1.5 }],
    [{ id: "burger", quantity: 21 }],
    [{ id: "missing", quantity: 1 }],
    [
      { id: "burger", quantity: 1 },
      { id: "burger", quantity: 1 },
    ],
  ]) {
    assert.equal(
      (
        await request("/orders", "POST", {
          customer: "Test",
          phone: "12345678",
          items,
        })
      ).status,
      400,
    );
  }
  await db.query("UPDATE menu SET available=0 WHERE id=$1", ["cookie"]);
  assert.equal(
    (
      await request("/orders", "POST", {
        customer: "Test",
        phone: "12345678",
        items: [{ id: "cookie", quantity: 1 }],
      })
    ).status,
    400,
  );
});
test("rejects invalid customer details without saving", async () => {
  for (const fields of [
    { customer: "", phone: "12345678" },
    { customer: "Test", phone: "abc" },
    { customer: "Test", phone: "12345678", notes: "a".repeat(501) },
  ])
    assert.equal(
      (
        await request("/orders", "POST", {
          ...fields,
          items: [{ id: "burger", quantity: 1 }],
        })
      ).status,
      400,
    );
});
test("protects admin endpoints and rejects wrong password", async () => {
  assert.equal((await request("/admin/orders")).status, 401);
  assert.equal(
    (await request("/admin/menu/burger", "PATCH", { price: 1, available: 1 }))
      .status,
    401,
  );
  assert.equal((await request("/admin/menu", "POST", {})).status, 401);
  assert.equal(
    (await request("/admin/login", "POST", { password: "wrong" })).status,
    401,
  );
});
test("admin can manage orders and menu, then logout invalidates access", async () => {
  const login = await request("/admin/login", "POST", {
    password: "test-password",
  });
  assert.equal(login.status, 200);
  assert.match(login.cookie, /HttpOnly/);
  cookie = login.cookie.split(";")[0];
  const orders = await request("/admin/orders", "GET", undefined, cookie);
  const id = orders.data[0].id;
  assert.equal(
    (await request(`/admin/orders/${id}`, "PATCH", { status: "Ready" }, cookie))
      .status,
    200,
  );
  assert.equal(
    (
      await request(
        `/admin/orders/${id}`,
        "PATCH",
        { status: "Invalid" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/admin/orders/missing",
        "PATCH",
        { status: "Ready" },
        cookie,
      )
    ).status,
    404,
  );
  assert.equal(
    (await request("/admin/orders", "GET", undefined, cookie)).data.find(
      (o) => o.id === id,
    ).status,
    "Ready",
  );
  const item = await request(
    "/admin/menu",
    "POST",
    {
      name: "Test item",
      description: "Test description",
      category: "Sides",
      emoji: "🍞",
      price: 500,
    },
    cookie,
  );
  assert.equal(item.status, 201);
  assert.equal(
    (
      await request(
        `/admin/menu/${item.data.id}`,
        "PATCH",
        { price: 600, available: 0 },
        cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("/menu")).data.find((i) => i.id === item.data.id).price,
    600,
  );
  await request("/admin/logout", "POST", {}, cookie);
  assert.equal(
    (await request("/admin/orders", "GET", undefined, cookie)).status,
    401,
  );
});
test("rejects cross-origin writes", async () => {
  const response = await fetch(base + "/orders", {
    method: "POST",
    headers: {
      Origin: "https://example.com",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(response.status, 403);
});
