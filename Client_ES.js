const { Kafka } = require("kafkajs");
const { Client } = require("@elastic/elasticsearch");
const { spawn } = require("child_process");

// Kafka consumer configuration
const kafkaConfig = {
  clientId: "my-app",
  brokers: ["localhost:9092"], // Replace with your Kafka broker address
  groupId: "test-consumer-group", // Replace with your consumer group ID
  topic: "test" // Replace with the Kafka topic you're consuming from
};

// Elasticsearch configuration
const esConfig = {
  node: "http://localhost:9200", // Replace with your Elasticsearch node URL
  auth: {
    username: "anthony19", // Replace with your Elasticsearch username
    password: "Assayah19" // Replace with your Elasticsearch password
  },
  index: "my-index" // Replace with the desired static index name
};

// Function to check if the Elasticsearch index exists
async function checkIndexExists(client, index) {
  return client.indices.exists({ index });
}

// Function to create the Elasticsearch index
async function createIndex(client, index) {
  await client.indices.create({ index });
  console.log("Index created successfully. Index name:", index);
}

// Function to send messages to Elasticsearch
async function toElasticsearch(client, message) {
  await client.index({
    index: esConfig.index, // Use the same index name for all messages
    body: message
  });

  console.log("Message sent to Elasticsearch successfully. Index name:", esConfig.index);
}

// Run the client
async function runClient() {
  const client = new Client({ node: esConfig.node, auth: esConfig.auth });

  const indexExists = await checkIndexExists(client, esConfig.index);
  if (!indexExists) {
    await createIndex(client, esConfig.index);
  }

  // Spawn a child process to run the simulator.js script
  const simulatorProcess = spawn("node", ["simulator.js"]);

  const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers
  });

  const consumer = kafka.consumer({ groupId: kafkaConfig.groupId });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: kafkaConfig.topic, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const jsonMessage = message.value.toString(); // Assuming the message value is a JSON string
        console.log(`Received message from Kafka: ${jsonMessage}`);

        // Send the message to Elasticsearch
        try {
          const esClient = new Client({ node: esConfig.node, auth: esConfig.auth });
          await toElasticsearch(esClient, jsonMessage);
        } catch (error) {
          console.error("Error sending message to Elasticsearch:", error);
        }

        // Make a POST request to the app.js server to trigger an update
        const http = require('http');
        const options = {
          hostname: 'localhost',
          port: 3001,
          path: '/update',
          method: 'POST'
        };

        const req = http.request(options, res => {
          console.log(`Update request status code: ${res.statusCode}`);
        });

        req.on('error', error => {
          console.error('Update request error:', error);
        });

        req.end();
      }
    });
  } catch (error) {
    console.error("Error consuming messages from Kafka:", error);
  }
}

runClient();
