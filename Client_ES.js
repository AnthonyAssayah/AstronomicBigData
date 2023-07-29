const { Kafka } = require('kafkajs');
const { Client } = require('@elastic/elasticsearch');
const moment = require('moment');
const io = require('socket.io-client');

const kafka = new Kafka({
  clientId: 'astronomy-event-client',
  brokers: ['social-rat-12153-us1-kafka.upstash.io:9092'],
  ssl: true,
  sasl: {
    mechanism: 'scram-sha-256',
    username: 'c29jaWFsLXJhdC0xMjE1MyQQkGxi-B3Bcz7EC7nEt4eC6y9L7Tky-8jwMTbm-dE',
    password: '8d90dada5d8b438b864685901bc2c4fa',
  },
});

const topic = 'astronomic';

// Elasticsearch configuration using Bonsai.io
const bonsaiConfig = {
  node: 'https://a308a0gamg:nqt2vxs23c@personal-search-9388846395.us-east-1.bonsaisearch.net:443',
  auth: {
    username: 'a308a0gamg',
    password: 'nqt2vxs23c',
  },
};

const client = new Client(bonsaiConfig);
const index = 'astronomic-index-new'; // The Elasticsearch index name where you want to push the messages
// Example of consuming messages from Kafka and pushing them to Elasticsearch

const socket = io('http://localhost:3000'); // Replace 'http://localhost:3000' with the correct server address


const consumeAndPushToElasticsearch = async () => {
  const consumer = kafka.consumer({ groupId: 'astronomy-event-group' });

  await consumer.connect();
  await consumer.subscribe({ topic });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { key, value } = message;
  
      // Process the received message from Kafka
      // console.log(`Received message on topic ${topic}, partition ${partition}, key ${key}, value ${value}`);
  
      // Parse the JSON message
      const parsedMessage = JSON.parse(value);
  
      //Convert the time field to ISO 8601 format
      const isoTime = moment(parsedMessage.time, 'ddd, DD MMM YYYY HH:mm:ss ZZ').toISOString();
      parsedMessage.time = isoTime;

      //   // Convert the RA and DEC fields to strings without rounding
      parsedMessage.location.RA = parsedMessage.location.RA.toString();
      parsedMessage.location.DEC = parsedMessage.location.DEC.toString();
  
      // Push the message to Elasticsearch
      await client.index({
        index,
        body: parsedMessage, // Use the modified parsed message object as the body
      });
  
      // Emit a 'newMessage' event to the server via Socket.IO
      socket.emit('newMessage', parsedMessage);

      // Print the message stored in Elasticsearch
      console.log('Message stored in Elasticsearch:', parsedMessage);
    },
  });
  
};



// Call the consumeAndPushToElasticsearch function to start consuming messages and pushing them to Elasticsearch
consumeAndPushToElasticsearch().catch((error) => console.error(`Error occurred: ${error}`));
