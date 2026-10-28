import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import pg from "pg";

export async function openDatabase(
  url = process.env.DATABASE_URL,
  filename = "data/campus.db",
) {
  let query, close;
  if (url) {
    const pool = new pg.Pool({ connectionString: url });
    query = async (sql, args = []) => (await pool.query(sql, args)).rows;
    close = () => pool.end();
  } else {
    mkdirSync("data", { recursive: true });
    const db = new DatabaseSync(filename);
    db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    query = async (sql, args = []) =>
      db.prepare(sql.replace(/\$\d+/g, "?")).all(...args);
    close = () => db.close();
  }
  await query(
    "CREATE TABLE IF NOT EXISTS menu (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL, emoji TEXT NOT NULL, available INTEGER NOT NULL DEFAULT 1)",
  );
  await query(
    "CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer TEXT NOT NULL, phone TEXT NOT NULL, notes TEXT NOT NULL, items TEXT NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)",
  );
  const seeds = [
    [
      "burger",
      "The Campus Classic",
      "Grilled beef, cheddar, crisp lettuce & our house sauce.",
      "Burgers",
      1250,
      "🍔",
    ],
    [
      "chicken",
      "Crispy Chicken Club",
      "Golden chicken, crunchy slaw & a little smoky mayo.",
      "Burgers",
      1400,
      "🍔",
    ],
    [
      "pizza",
      "Margherita Moment",
      "Tomato, melted mozzarella & fresh basil. A classic.",
      "Pizza",
      1600,
      "🍕",
    ],
    [
      "bowl",
      "The Green Break",
      "Chickpeas, avocado, seasonal greens & lemon dressing.",
      "Bowls",
      1100,
      "🥗",
    ],
    [
      "fries",
      "Golden Hour Fries",
      "Crispy potato fries with sea salt & house ketchup.",
      "Sides",
      450,
      "🍟",
    ],
    [
      "lemonade",
      "Fresh Lemonade",
      "Freshly squeezed lemon, mint & just enough sweetness.",
      "Drinks",
      400,
      "🍋",
    ],
    [
      "pasta",
      "Pesto Study Bowl",
      "Penne, basil pesto, cherry tomatoes & parmesan.",
      "Bowls",
      1300,
      "🍝",
    ],
    [
      "cookie",
      "Chocolate Chunk Cookie",
      "Freshly baked, soft in the middle, generous on chocolate.",
      "Sides",
      350,
      "🍪",
    ],
  ];
  for (const row of seeds)
    await query(
      "INSERT INTO menu (id,name,description,category,price,emoji) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING",
      row,
    );
  return { query, close };
}
