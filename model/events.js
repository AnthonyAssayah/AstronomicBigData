const { Kafka } = require('kafkajs');

// Kafka configuration
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['social-rat-12153-us1-kafka.upstash.io:9092'],
  sasl: {
    mechanism: 'scram-sha-256',
    username: 'c29jaWFsLXJhdC0xMjE1MyQQkGxi-B3Bcz7EC7nEt4eC6y9L7Tky-8jwMTbm-dE',
    password: '8d90dada5d8b438b864685901bc2c4fa',
  },
  ssl: true,
});

const consumer = kafka.consumer({ groupId: 'my-group' });

async function runConsumer(data) {
  await consumer.connect();
  await consumer.subscribe({ topic: 'astronomic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value.toString();
      const parsedMessage = JSON.parse(value);

      // Update data.messages with the new message
      data.messages.unshift(parsedMessage);

      // Emit the updated data to connected clients
      io.emit('newMessage', parsedMessage);
    },
  });
}


module.exports = { runConsumer };
