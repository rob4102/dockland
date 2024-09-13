const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./listings.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  }
});

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

// Existing API endpoints...

// Endpoint to fetch Zillow listings and save them to the database
app.get('/api/fetch-zillow-listings', (req, res) => {
  getZillowListings(db)
    .then(() => {
      res.json({ message: 'Zillow listings fetched and saved to the database.' });
    })
    .catch((err) => {
      res.status(500).json({ error: 'Failed to fetch Zillow listings' });
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
