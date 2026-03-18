const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database("./leaderboard.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      seconds INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Solitaire leaderboard API is running.");
});

app.get("/api/solitaire-leaderboard", (req, res) => {
  db.all(
    `
    SELECT name, seconds, created_at
    FROM leaderboard
    ORDER BY seconds ASC, created_at ASC
    LIMIT 10
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to load leaderboard" });
      }
      res.json(rows);
    }
  );
});

app.post("/api/solitaire-score", (req, res) => {
  let { name, seconds } = req.body;

  name = String(name || "").trim();
  seconds = Number(seconds);

  if (!name) name = "Anonymous";
  if (name.length > 24) name = name.slice(0, 24);

  if (!Number.isInteger(seconds) || seconds < 5 || seconds > 86400) {
    return res.status(400).json({ error: "Invalid score" });
  }

  db.run(
    `INSERT INTO leaderboard (name, seconds) VALUES (?, ?)`,
    [name, seconds],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to save score" });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.delete("/api/solitaire-leaderboard", (req, res) => {
  db.run(`DELETE FROM leaderboard`, [], (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to clear leaderboard" });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});