import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const money = (cents) => `${(cents / 100).toFixed(2)} DT`;
async function api(path, method = "GET", body) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
function App() {
  const [menu, setMenu] = useState([]),
    [cart, setCart] = useState({}),
    [category, setCategory] = useState("All"),
    [search, setSearch] = useState("");
  const [view, setView] = useState("menu"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [confirmation, setConfirmation] = useState(null);
  const [admin, setAdmin] = useState(false),
    [orders, setOrders] = useState([]),
    [adminTab, setAdminTab] = useState("Orders");
  const refreshMenu = async () => setMenu(await api("/menu"));
  useEffect(() => {
    refreshMenu()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const items = menu
    .filter((item) => cart[item.id])
    .map((item) => ({ ...item, quantity: cart[item.id] }));
  const count = items.reduce((n, item) => n + item.quantity, 0),
    total = items.reduce((n, item) => n + item.price * item.quantity, 0);
  const change = (id, delta) =>
    setCart((current) => ({
      ...current,
      [id]: Math.min(20, Math.max(0, (current[id] || 0) + delta)),
    }));
  async function act(action) {
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function refreshOrders() {
    setOrders(await api("/admin/orders"));
  }
  function go(next) {
    setView(next);
    setError("");
  }
  return (
    <>
      <header>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("menu");
          }}
        >
          <span className="brand-icon">b.</span> campus
          <span className="brand-light">bites</span>
        </a>
        <nav>
          <button
            className={view === "menu" ? "nav-active" : ""}
            onClick={() => go("menu")}
          >
            Our menu
          </button>
          <button
            className={view === "admin" ? "nav-active" : ""}
            onClick={() => go("admin")}
          >
            Admin
          </button>
          <button
            className="cart-button"
            onClick={() => {
              go("menu");
              document
                .getElementById("basket")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Your bag <span>{count}</span>
          </button>
        </nav>
      </header>
      {error && (
        <div role="alert" className="error">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {view === "menu" ? (
        <>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span /> FRESHLY MADE. LOCALLY LOVED.
              </div>
              <h1>
                Good food.
                <br />
                Better <em>breaks.</em>
              </h1>
              <p>
                Your next favorite bite is right here. Fresh ingredients,
                <br className="desktop-break" /> feel-good flavors, and a little
                time for yourself.
              </p>
              <a className="primary hero-link" href="#menu">
                Find your favorite <span>↗</span>
              </a>
              <div className="hero-note">
                <span>✦</span> Made fresh to order <span>·</span> Campus pickup
              </div>
            </div>
            <div className="hero-art" aria-label="Illustrated burger meal">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <span className="art-label">THE GOOD STUFF</span>
              <span className="giant-burger">🍔</span>
              <span className="floating-fries">🍟</span>
              <span className="fresh-stamp">
                100%
                <br />
                <small>GOOD MOOD</small>
              </span>
              <span className="art-caption">a little break. a big bite.</span>
              <span className="spark spark-one">✳</span>
              <span className="spark spark-two">✦</span>
            </div>
          </section>
          <div className="benefits">
            <span>✳ Fresh ingredients</span>
            <span>♡ Made with care</span>
            <span>↗ Easy campus pickup</span>
            <span>◷ Your break, upgraded</span>
          </div>
          <main className="shop-layout" id="menu">
            <section>
              <div className="section-heading">
                <div>
                  <div className="eyebrow">THE MENU</div>
                  <h2>What are you craving?</h2>
                </div>
                <span className="menu-count">
                  {menu.filter((item) => item.available).length} good choices
                </span>
              </div>
              <div className="menu-controls">
                <div className="categories">
                  {["All", ...new Set(menu.map((item) => item.category))].map(
                    (name) => (
                      <button
                        className={category === name ? "selected" : ""}
                        key={name}
                        onClick={() => setCategory(name)}
                      >
                        {name}
                      </button>
                    ),
                  )}
                </div>
                <input
                  className="search"
                  aria-label="Search menu"
                  placeholder="Search something tasty…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {loading ? (
                <p>Getting the good stuff ready…</p>
              ) : (
                <div className="food-grid">
                  {menu
                    .filter(
                      (item) =>
                        (category === "All" || item.category === category) &&
                        `${item.name} ${item.description}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                    )
                    .map((item) => (
                      <article className="food-card" key={item.id}>
                        <div
                          className={`food-art art-${item.category.toLowerCase()}`}
                        >
                          <span>{item.emoji}</span>
                          <small>
                            {item.available
                              ? item.category === "Burgers"
                                ? "CAMPUS FAVORITE"
                                : "MADE FRESH"
                              : "SOLD OUT"}
                          </small>
                        </div>
                        <div className="food-content">
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
                          <div className="food-bottom">
                            <strong>{money(item.price)}</strong>
                            <button
                              className="add"
                              disabled={!item.available || cart[item.id] >= 20}
                              aria-label={`Add ${item.name}`}
                              onClick={() => change(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              )}
              {!loading &&
                !menu.some(
                  (item) =>
                    (category === "All" || item.category === category) &&
                    `${item.name} ${item.description}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                ) && <p className="empty">No matches. Try another craving.</p>}
            </section>
            <aside className="basket" id="basket">
              <div className="basket-title">
                <h2>Your bag</h2>
                <span>
                  {count} {count === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="pickup">
                <span>↗</span>
                <div>
                  <strong>Campus pickup</strong>
                  <small>We’ll prepare it fresh for you.</small>
                </div>
              </div>
              {confirmation ? (
                <div className="confirmation" role="status">
                  <span>✓</span>
                  <h3>You’re on the list!</h3>
                  <p>Order #{confirmation.id.slice(0, 8)}</p>
                  <p>
                    Your order has been received. Head to the campus counter for
                    pickup.
                  </p>
                  {confirmation.items.map((item) => (
                    <p key={item.id}>
                      {item.quantity} × {item.name}
                    </p>
                  ))}
                  <strong>{money(confirmation.total)}</strong>
                  <button
                    className="primary"
                    onClick={() => setConfirmation(null)}
                  >
                    Order something else
                  </button>
                </div>
              ) : (
                <>
                  {!items.length ? (
                    <div className="empty-bag">
                      <span>♧</span>
                      <h3>A little empty in here</h3>
                      <p>
                        Add something delicious.
                        <br />
                        Your next good break starts here.
                      </p>
                    </div>
                  ) : (
                    <div className="cart-items">
                      {items.map((item) => (
                        <div className="cart-item" key={item.id}>
                          <span className="cart-emoji">{item.emoji}</span>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{money(item.price)}</small>
                            <div className="quantity">
                              <button
                                aria-label={`Remove one ${item.name}`}
                                onClick={() => change(item.id, -1)}
                              >
                                −
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                aria-label={`Add one ${item.name}`}
                                disabled={item.quantity >= 20}
                                onClick={() => change(item.id, 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <strong>{money(item.price * item.quantity)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="totals">
                    <div>
                      <span>Subtotal</span>
                      <span>{money(total)}</span>
                    </div>
                    <div>
                      <span>Pickup</span>
                      <span className="green">Free</span>
                    </div>
                    <div className="grand-total">
                      <strong>Total</strong>
                      <strong>{money(total)}</strong>
                    </div>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fields = Object.fromEntries(
                        new FormData(e.currentTarget),
                      );
                      act(async () => {
                        const order = await api("/orders", "POST", {
                          ...fields,
                          items: items.map(({ id, quantity }) => ({
                            id,
                            quantity,
                          })),
                        });
                        setConfirmation(order);
                        setCart({});
                      });
                    }}
                  >
                    <label>
                      Your name
                      <input
                        name="customer"
                        required
                        maxLength={80}
                        placeholder="e.g. Taha"
                        disabled={!count}
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        name="phone"
                        type="tel"
                        required
                        maxLength={25}
                        placeholder="Your contact number"
                        disabled={!count}
                      />
                    </label>
                    <label>
                      Order notes <span>(optional)</span>
                      <textarea
                        name="notes"
                        maxLength={500}
                        placeholder="Anything we should know?"
                        disabled={!count}
                      />
                    </label>
                    <button
                      className="primary checkout"
                      disabled={!count || busy}
                    >
                      {busy ? "Placing your order…" : "Place order"}{" "}
                      <span>→</span>
                    </button>
                    <p className="checkout-note">
                      Pay at pickup. No online payment needed.
                    </p>
                  </form>
                </>
              )}
            </aside>
          </main>
        </>
      ) : (
        <main className="admin-page">
          <div className="eyebrow">BEHIND THE COUNTER</div>
          <h1>Kitchen dashboard.</h1>
          {!admin ? (
            <form
              className="login-panel"
              onSubmit={(e) => {
                e.preventDefault();
                const password = new FormData(e.currentTarget).get("password");
                act(async () => {
                  await api("/admin/login", "POST", { password });
                  await refreshOrders();
                  setAdmin(true);
                });
              }}
            >
              <h2>Welcome back</h2>
              <p>Sign in to manage your menu and incoming orders.</p>
              <label>
                Admin password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button className="primary" disabled={busy}>
                Sign in →
              </button>
            </form>
          ) : (
            <>
              <div className="admin-toolbar">
                <div className="categories">
                  {["Orders", "Menu"].map((tab) => (
                    <button
                      key={tab}
                      className={adminTab === tab ? "selected" : ""}
                      onClick={() => setAdminTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button onClick={() => act(refreshOrders)}>
                  Refresh orders
                </button>
                <button
                  onClick={() =>
                    act(async () => {
                      await api("/admin/logout", "POST");
                      setAdmin(false);
                    })
                  }
                >
                  Sign out
                </button>
              </div>
              {adminTab === "Orders" ? (
                <div className="orders">
                  {!orders.length && (
                    <p className="empty">
                      No orders yet. Your first good bite is on its way.
                    </p>
                  )}
                  {orders.map((order) => (
                    <article className="order-card" key={order.id}>
                      <div className="order-heading">
                        <div>
                          <h3>
                            #{order.id.slice(0, 8)} · {order.customer}
                          </h3>
                          <small>
                            {new Date(order.created_at).toLocaleString()} ·{" "}
                            {order.phone}
                          </small>
                        </div>
                        <strong>{money(order.total)}</strong>
                      </div>
                      <p>
                        {order.items
                          .map((item) => `${item.quantity} × ${item.name}`)
                          .join(" · ")}
                      </p>
                      {order.notes && <p>Note: {order.notes}</p>}
                      <label>
                        Status
                        <select
                          aria-label={`Status for order ${order.id.slice(0, 8)}`}
                          value={order.status}
                          disabled={busy}
                          onChange={(e) =>
                            act(async () => {
                              await api(`/admin/orders/${order.id}`, "PATCH", {
                                status: e.target.value,
                              });
                              await refreshOrders();
                            })
                          }
                        >
                          {[
                            "Received",
                            "Preparing",
                            "Ready",
                            "Completed",
                            "Cancelled",
                          ].map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
                </div>
              ) : (
                <>
                  <div className="admin-menu">
                    {menu.map((item) => (
                      <form
                        key={item.id}
                        className="menu-row"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fields = new FormData(e.currentTarget);
                          act(async () => {
                            await api(`/admin/menu/${item.id}`, "PATCH", {
                              price: Math.round(
                                Number(fields.get("price")) * 100,
                              ),
                              available: fields.has("available") ? 1 : 0,
                            });
                            await refreshMenu();
                          });
                        }}
                      >
                        <strong>
                          {item.emoji} {item.name}
                        </strong>
                        <label>
                          Price (DT)
                          <input
                            name="price"
                            type="number"
                            min="0.01"
                            max="1000"
                            step="0.01"
                            defaultValue={item.price / 100}
                            required
                          />
                        </label>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            name="available"
                            defaultChecked={!!item.available}
                          />{" "}
                          Available
                        </label>
                        <button className="primary" disabled={busy}>
                          Save
                        </button>
                      </form>
                    ))}
                  </div>
                  <form
                    className="new-item"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const fields = Object.fromEntries(new FormData(form));
                      act(async () => {
                        await api("/admin/menu", "POST", {
                          ...fields,
                          price: Math.round(Number(fields.price) * 100),
                        });
                        await refreshMenu();
                        form.reset();
                      });
                    }}
                  >
                    <h2>Add a new favorite</h2>
                    <div className="form-grid">
                      {["name", "description", "category", "emoji"].map(
                        (field) => (
                          <label key={field}>
                            {field}
                            <input
                              name={field}
                              required
                              maxLength={300}
                              defaultValue={field === "emoji" ? "🍽️" : ""}
                            />
                          </label>
                        ),
                      )}
                      <label>
                        Price (DT)
                        <input
                          type="number"
                          min="0.01"
                          max="1000"
                          step="0.01"
                          name="price"
                          required
                        />
                      </label>
                    </div>
                    <button className="primary" disabled={busy}>
                      Add menu item +
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </main>
      )}
      <footer>
        <a className="brand" href="#">
          campusbites<span>✳</span>
        </a>
        <p>Good food. Good company. Right on campus.</p>
        <small>Made for your everyday breaks.</small>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
