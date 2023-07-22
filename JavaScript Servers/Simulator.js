const { Kafka, Partitioners} = require("kafkajs");
const fs = require('fs');

async function sendMessageToKafka(topic, message) {
  // Create a Kafka client
  const kafka = new Kafka({
    brokers: ['social-rat-12153-us1-kafka.upstash.io:9092'],
    sasl: {
      mechanism: 'scram-sha-256',
      username: 'c29jaWFsLXJhdC0xMjE1MyQQkGxi-B3Bcz7EC7nEt4eC6y9L7Tky-8jwMTbm-dE',
      password: '8d90dada5d8b438b864685901bc2c4fa',
    },
    ssl: true,
  })
  

  // Create a Kafka producer
  const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });

  try {
    // Connect to Kafka broker
    await producer.connect();

    // Log the message before sending
    console.log("Message to be sent to Kafka:", message);

    // Send the message to the specified topic
    await producer.send({
      topic: topic,
      messages: [{ key: null, value: message }]
    });

    console.log("Message sent to Kafka successfully");
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
  } finally {
    // Disconnect the producer
    await producer.disconnect();
  }
}

// Array of observatories or satellite telescopes
const observatories = [
  "European Extremely Large Telescope",
  "Thirty Meter Telescope",
  "The Giant Magellan Telescope",
  "Gran Telescopio Canarias",
  "Hobby-Eberly Telescope",
  "Keck 1 and 2",
  "Southern African Large Telescope",
  "Large Binocular Telescope",
  "Subaru Telescope",
  "Very Large Telescope",
  "Gemini Observatory Telescopes",
  "MMT"
];

// Array of activity types
const activityTypes = [
  "GRB",
  "Rise Brightness Apprentice",
  "UV Rise",
  "X-Ray Rise",
  "Comet"
];
// Read the Bright Star Catalog JSON file
const bscFilePath = './BSC.json';
const bscData = fs.readFileSync(bscFilePath);
const bscJson = JSON.parse(bscData);

// Generate a random message in JSON format
function generateRandomMessage() {
  const randomIndex = Math.floor(Math.random() * bscJson.length);
  const star = bscJson[randomIndex];

  const message = {
    time: getRandomTime(),
    observatory: getRandomObservatory(),
    location: {
      RA: star.RA, 
      DEC: star.DEC 
    },
    activity: getRandomActivity(),
    urgency: getRandomUrgency(),
    title: star['Title HD']
  };

  return JSON.stringify(message);
}

// Generate a random time and date in UTC
function getRandomTime() {
  const startDate = new Date("2021-01-01");
  const endDate = new Date();
  const randomTime = new Date(
    startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
  );
  return randomTime.toUTCString();
}

// Get a random observatory
function getRandomObservatory() {
  return observatories[Math.floor(Math.random() * observatories.length)];
}

// Get a random activity type
function getRandomActivity() {
  return activityTypes[Math.floor(Math.random() * activityTypes.length)];
}

// Generate a random urgency level
function getRandomUrgency() {
  return Math.floor(Math.random() * 5) + 1;
}

// Example usage: sending 5 random messages to Kafka
const topic = "astronomic";

(async () => {
  try {
    for (let i = 0; i < 5; i++) {
      const randomMessage = generateRandomMessage();
      await sendMessageToKafka(topic, randomMessage);
    }
  } catch (error) {
    console.error("Failed to send messages to Kafka:", error);
  }
})();

