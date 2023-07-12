const Redis = require('ioredis');

const redisUrl = 'redis://default:c88afbb548b34ca798690c98565143c9@us1-inspired-drum-38256.upstash.io:38256';

// Read the JSON file
const jsonData = require('./BSC.json');

// Upload data to Redis
async function uploadDataToRedis() {
    const redisClient = new Redis(redisUrl);

    try {
        // Upload each element to Redis
        Object.values(jsonData).forEach(async (element) => {
            await redisClient.set(element['harvard_ref_#'].toString(), JSON.stringify(element));
            console.log(JSON.stringify(element));
        });

        // Print a success message
        console.log('Data uploaded to Redis.');
    } catch (error) {
        console.error('Error uploading data to Redis:', error);
    } finally {
        redisClient.quit();
    }
}

// Call the function to upload data to Redis
uploadDataToRedis();