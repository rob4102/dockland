const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 5000;

// Use CORS to allow requests from your frontend
app.use(cors());
app.use(express.json());

// Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database('./listings.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  }
});

// Create listings table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  latitude REAL,
  longitude REAL
)`);

// Endpoint to get all listings
app.get('/api/listings', (req, res) => {
  db.all(`SELECT * FROM listings`, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ listings: rows });
  });
});

// Endpoint to add a new listing
app.post('/api/listings', (req, res) => {
  const { title, description, latitude, longitude } = req.body;
  db.run(`INSERT INTO listings (title, description, latitude, longitude) VALUES (?, ?, ?, ?)`,
    [title, description, latitude, longitude],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
