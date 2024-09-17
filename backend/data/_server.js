const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 5000;

// CORS configuration for specific origins
const allowedOrigins = ['https://prodocker.netlify.app', 'http://localhost:3000'];


app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));


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

db.run(`CREATE TABLE IF NOT EXISTS zillow_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zpid TEXT,
  status TEXT,
  sold_price TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  image_url TEXT,
  detail_url TEXT,
  sold_date TEXT,
  broker TEXT
)`);

// Endpoint to fetch Zillow listings and save them to the database
app.get('/api2/zillow-listings', (req, res) => {
  getZillowListings(db)
    .then(() => {
      res.json({ message: 'Zillow listings fetched and saved to the database.' });
    })
    .catch((err) => {
      res.status(500).json({ error: 'Failed to fetch Zillow listings' });
    });
});


// Endpoint to get all listings
app.get('/api2/listings', (req, res) => {
  db.all(`SELECT * FROM listings`, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ listings: rows });
  });
});

// Endpoint to add a new listing
app.post('/api2/listings', (req, res) => {
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

