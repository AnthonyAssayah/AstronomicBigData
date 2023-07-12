const { Kafka } = require("kafkajs");

async function sendMessageToKafka(topic, message) {
  // Create a Kafka client
  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"] // Replace with your Kafka broker address
  });

  // Create a Kafka producer
  const producer = kafka.producer();

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

// Generate a random message in JSON format
function generateRandomMessage() {
  const message = {
    time: getRandomTime(),
    observatory: getRandomObservatory(),
    location: getRandomLocation(),
    activity: getRandomActivity(),
    urgency: getRandomUrgency()
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

// Generate a random location
function getRandomLocation() {
  const min = -180;
  const max = 180;
  return {
    RA: getRandomValueBetween(min, max),
    DEC: getRandomValueBetween(min, max)
  };
}

// Get a random activity type
function getRandomActivity() {
  return activityTypes[Math.floor(Math.random() * activityTypes.length)];
}

// Generate a random urgency level
function getRandomUrgency() {
  return Math.floor(Math.random() * 5) + 1;
}

// Helper function to generate random values between min and max (inclusive)
function getRandomValueBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Example usage: sending 5 random messages to Kafka
const topic = "test";

(async () => {
  for (let i = 0; i < 5; i++) {
    const randomMessage = generateRandomMessage();
    await sendMessageToKafka(topic, randomMessage);
  }
})();

