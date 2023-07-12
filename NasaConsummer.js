const axios = require('axios');
const Redis = require('ioredis');

const NASA_API_KEY = 'PkhF6B4cuH22gwSHKSmLWhbLxbVPXDDb2GuRoKeQ'; // Replace with your NASA API key
const NASA_API_URL = 'https://api.nasa.gov/neo/rest/v1/feed';
const REDIS_HOST = 'us1-valued-sawfish-38283.upstash.io'; // Replace with your Upstash Redis host
const REDIS_PORT = 38283; // Replace with your Upstash Redis port
const REDIS_PASSWORD = '358850d72bf14272ae4d292f4ccf24ee'; // Replace with your Upstash Redis password

const shouldStoreData = true; // Set this variable to control data storage (true to enable, false to disable)

// Function to fetch data from the NASA API
async function fetchDataFromNASA() {
  const response = await axios.get(NASA_API_URL, {
    params: {
      api_key: NASA_API_KEY
    }
  });
  return response.data;
}

// Function to store data in Upstash Redis
async function storeDataInRedis(data) {
  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD
  });

  for (const date in data.near_earth_objects) {
    const asteroids = data.near_earth_objects[date];
    for (const asteroid of asteroids) {
      await redis.set(`asteroid id :${asteroid.id}`, JSON.stringify(asteroid));
    }
  }

  console.log('Data stored in Redis successfully');
  redis.disconnect();
}

// Main function to fetch data from NASA API and store it in Redis
async function consumeNASAData() {
  try {
    if (shouldStoreData) {
      const nasaData = await fetchDataFromNASA();
      await storeDataInRedis(nasaData);
    } else {
      console.log('Data storage is disabled');
    }
  } catch (error) {
    console.error('Error consuming NASA data:', error);
  }
}

// Run the main function
consumeNASAData();
