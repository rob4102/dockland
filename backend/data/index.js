



const axios = require('axios').default;
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

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

// Function to fetch Zillow homepage and get cookies
async function getZillowListings() {
  try {
    // Step 1: Make a request to the Zillow homepage to get cookies
    const homepageResponse = await client.get('https://www.zillow.com/');

    console.log('Cookies obtained:', jar);

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
          "sortSelection": {
            "value": "globalrelevanceex"
          },
          "isForSaleByAgent": { "value": false },
          "isForSaleByOwner": { "value": false },
          "isNewConstruction": { "value": false },
          "isComingSoon": { "value": false },
          "isAuction": { "value": false },
          "isForSaleForeclosure": { "value": false },
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

    // Step 4: Normalize and log the response data
    if (response.data && response.data.cat1 && response.data.cat1.searchResults && response.data.cat1.searchResults.listResults) {
      const listings = response.data.cat1.searchResults.listResults;

      // Normalize data
      const normalizedListings = listings.map((listing) => ({
        zpid: listing.zpid,
        status: listing.statusText,
        soldPrice: listing.soldPrice,
        address: `${listing.addressStreet}, ${listing.addressCity}, ${listing.addressState} ${listing.addressZipcode}`,
        lotArea: listing.lotAreaString,
        latitude: listing.latLong.latitude,
        longitude: listing.latLong.longitude,
        imageUrl: listing.imgSrc,
        detailUrl: listing.detailUrl,
        soldDate: listing.flexFieldText,
        broker: listing.brokerName
      }));

      console.log(normalizedListings);
    } else {
      console.log('No listings found in the response.');
    }
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

// Call the function to fetch Zillow listings
getZillowListings();
