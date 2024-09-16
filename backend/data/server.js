const axios = require('axios').default;
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const sqlite3 = require('sqlite3').verbose();

// Initialize a cookie jar
const jar = new CookieJar();

// Create an instance of axios that supports cookies
const client = wrapper(axios.create({
  jar,
  withCredentials: true,  // Send cookies with requests
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
  }
}));

// Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database('./listings.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create zillow_listings table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS zillow_listings (
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
  )
`, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('zillow_listings table is ready.');
  }
});

// Function to fetch Zillow listings and save them to the database
async function getZillowListings() {
  try {
    // Step 1: Make a request to the Zillow homepage to get cookies
    await client.get('https://www.zillow.com/');

    // Step 2: Use cookies in subsequent request to the API
    const url = 'https://www.zillow.com/async-create-search-page-state';
    const body = {
      "searchQueryState": {
        "pagination": {},
        "isMapVisible": false,
        "mapBounds": {
          "west": -82.22190767526627,
          "east": -82.2186890244484,
          "south": 34.932520064912794,
          "north": 34.9342792039549
        },
        "usersSearchTerm": "221 Emerald Crk Greer, SC 29651",
        "regionSelection": [
          {
            "regionId": 24965,
            "regionType": 6
          }
        ],
        "filterState": {
          "isRecentlySold": { "value": true },
          "isAllHomes": { "value": true }
        },
        "isListVisible": true
      },
      "wants": {
        "cat1": ["listResults"]
      },
      "requestId": 2,
      "isDebugRequest": false
    };

    // Step 3: Make the request to the Zillow listings API
    const response = await client.put(url, body);

    // Step 4: Normalize and save the response data
    if (response.data && response.data.cat1 && response.data.cat1.searchResults && response.data.cat1.searchResults.listResults) {
      const listings = response.data.cat1.searchResults.listResults;

      const insertStatement = db.prepare(
        `INSERT INTO zillow_listings 
        (zpid, status, sold_price, address, latitude, longitude, image_url, detail_url, sold_date, broker) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      listings.forEach((listing) => {
        const { zpid, statusText, soldPrice, addressStreet, addressCity, addressState, addressZipcode, latLong, imgSrc, detailUrl, flexFieldText, brokerName } = listing;

        insertStatement.run(
          zpid, 
          statusText || '',
          soldPrice || '',
          `${addressStreet}, ${addressCity}, ${addressState} ${addressZipcode}`,
          latLong.latitude || 0,
          latLong.longitude || 0,
          imgSrc || '',
          detailUrl || '',
          flexFieldText || '',
          brokerName || '',
          function(err) {
            if (err) {
              console.error('Error inserting data:', err.message);
            }
          }
        );
      });

      insertStatement.finalize(() => {
        console.log('All listings saved to database.');
      });

    } else {
      console.log('No listings found in the response.');
    }
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

// Fetch and save Zillow listings
getZillowListings();

// Close the database connection when done
process.on('exit', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});
