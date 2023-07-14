// const express = require('express');
// const { Client } = require('@elastic/elasticsearch');
// const Redis = require('ioredis');
// const cors = require('cors');

// const app = express();
// const port = 3001;

// app.use(cors()); // Add this line to enable CORS

// // Elasticsearch configuration  
// const esConfig = {
//   node: 'https://a308a0gamg:nqt2vxs23c@personal-search-9388846395.us-east-1.bonsaisearch.net:443', // Replace with the correct Elasticsearch node URL
//   auth: {
//     username: 'a308a0gamg', // Replace with the correct Elasticsearch username
//     password: 'nqt2vxs23c' // Replace with the correct Elasticsearch password
//   },
//   index: 'astronomic-index-new' // Replace with the Elasticsearch index you want to fetch from
// };


// // Redis configuration
// const REDIS_HOST = 'us1-valued-sawfish-38283.upstash.io'; // Replace with your Upstash Redis host
// const REDIS_PORT = 38283; // Replace with your Upstash Redis port
// const REDIS_PASSWORD = '358850d72bf14272ae4d292f4ccf24ee'; // Replace with your Upstash Redis password

// // Function to fetch messages from Elasticsearch
// async function getFromES() {
//   const client = new Client({ node: esConfig.node, auth: esConfig.auth });

//   try {
//     const searchResponse = await client.search({
//       index: esConfig.index,
//       body: { size: 5, query: { match_all: {} } } // Fetch 5 documents, you can adjust the size as per your requirements
//     });

//     const messages = searchResponse.body.hits.hits.map(hit => hit._source);
//     return messages;
//   } catch (error) {
//     console.error('Error fetching messages from Elasticsearch:', error);
//     throw error;
//   }
// }




// // Function to fetch asteroid data from Upstash Redis
// async function getAsteroidsFromRedis() {
//     const redis = new Redis({
//       host: REDIS_HOST,
//       port: REDIS_PORT,
//       password: REDIS_PASSWORD
//     });
  
//     const keys = await redis.keys('asteroid id *');
//     const asteroids = [];
  
//     for (const key of keys) {
//       const asteroidData = await redis.get(key);
//       const asteroid = JSON.parse(asteroidData);
//       asteroids.push(asteroid);
//     }
  
//     redis.disconnect();
  
//     return asteroids;
// }
  

// // Route to handle the GET request for fetching and rendering messages and asteroids
// app.get('/messages', async (req, res) => {
//     try {
//       const messages = await getFromES();
//       res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
//       res.render('index', { messages }); // Render the index.ejs template and pass the messages as a variable
//     } catch (error) {
//       res.status(500).send('Internal Server Error');
//     }
//   });
  
//   // Route to handle the GET request for fetching and rendering asteroids
//   app.get('/asteroids', async (req, res) => {
//     try {
//       const asteroids = await getAsteroidsFromRedis();
//       res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
//       res.render('asteroids', { asteroids }); // Render the asteroids.ejs template and pass the asteroids data as a variable
//     } catch (error) {
//       res.status(500).send('Internal Server Error');
//     }
//   });
  
  


// // Route handler to handle the POST request for triggering an update
// app.post('/update', async (req, res) => {
//   console.log('Received update request');

//   try {
//     const messages = await getFromES();
//     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
//     res.render('index', { messages }); // Render the index.ejs template and pass the messages as a variable
//   } catch (error) {
//     res.status(500).send('Internal Server Error');
//   } 
// });

// // Set the view engine and static file directory
// app.set('view engine', 'ejs');
// app.use(express.static('public'));

// // Start the server
// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });






const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Client } = require('@elastic/elasticsearch');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Elasticsearch configuration using Bonsai.io
const bonsaiConfig = {
  node: 'https://a308a0gamg:nqt2vxs23c@personal-search-9388846395.us-east-1.bonsaisearch.net:443',
  auth: {
    username: 'a308a0gamg',
    password: 'nqt2vxs23c',
  },
};

const client = new Client(bonsaiConfig);
const index = 'astronomic-index-new'; // The Elasticsearch index name where the messages are stored

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
  try {
    const { query } = req;
    const searchQuery = query.search;
    const searchFilter = query.filter;
    const messages = await searchMessages(searchQuery, searchFilter);

    res.render('index', { messages, searchQuery, searchFilter });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Internal Server Error');
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('newMessage', (message) => {
    // Broadcast the new message to all connected clients
    io.emit('newMessage', message);
  });

  socket.on('search', ({ search, filter }) => {
    searchMessages(search, filter)
      .then((messages) => {
        io.to(socket.id).emit('searchResult', messages);
      })
      .catch((error) => {
        console.error('Error searching messages:', error);
      });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

async function searchMessages(searchQuery, searchFilter) {
  let searchBody = {
    query: {
      match_all: {},
    },
    sort: [
      { time: { order: 'desc' } } // Sort by the "time" field in descending order
    ],
    size: 10 // Retrieve the latest 10 messages
  };

  if (searchQuery && searchFilter) {
    searchBody = {
      query: {
        match_phrase: {
          [searchFilter]: searchQuery
        }
      },
      sort: [
        { time: { order: 'desc' } } // Sort by the "time" field in descending order
      ],
      size: 10 // Retrieve the latest 10 matching messages
    };
  }

  const { body } = await client.search({
    index,
    body: searchBody,
  });

  const messages = body.hits.hits.map(hit => hit._source);
  return messages;
}

const port = 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
