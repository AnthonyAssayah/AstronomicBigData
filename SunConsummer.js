const axios = require('axios');
const cheerio = require('cheerio');
const { Redis } = require('ioredis');

// Redis configuration
const redisConfig = {
  host: 'us1-valued-sawfish-38283.upstash.io',
  port: '38283',
  password: '358850d72bf14272ae4d292f4ccf24ee'
};

// Function to fetch and store the HTML content in Redis
async function fetchAndStoreHTML() {
  try {
    // Fetch the HTML content
    const response = await axios.get('https://www.spaceweatherlive.com/en/solar-activity.html');
    const htmlContent = response.data;

    // Store the HTML content in Redis
    const redisClient = new Redis(redisConfig);
    await redisClient.set('sun_data', htmlContent);

    console.log('HTML content stored in Redis successfully');
  } catch (error) {
    console.error('Error fetching and storing HTML content:', error);
  }
}

// Run the fetchAndStoreHTML function
fetchAndStoreHTML();
