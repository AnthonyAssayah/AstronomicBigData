  const express = require('express');
  const app = express();
  const socketIO = require('socket.io');
  const http = require('http');
  const axios = require('axios');
  const mongoose = require('mongoose');
  const { Kafka, Partitioners} = require("kafkajs");
  const { Client } = require('@elastic/elasticsearch');

  const port = 3001;

  app.use(express.static('public'));
  app.set('view engine', 'ejs');

  // Export the functions so that other files can use them
  const { scrapegraphSun, scrapeSunData } = require('./SunScrapping'); // Import the functions
  const { fetchAllWeatherData } = require('./weather'); // Import the function from weather.js
  const { runConsumer} = require('./events'); // Import the function from events.js
  const { fetchAsteroids } = require('./asteroids'); // Import the function from asteroids.js


  // Elasticsearch configuration
  const bonsaiConfig = {
    node: 'http://localhost:9200',
  };

  const client = new Client(bonsaiConfig);
  const index = 'astronomic-index-new';

  
  // dashboard page route
  app.get('/', async (req, res) => {
    try {
      const { query } = req;
      const searchQuery = query.search;
      const searchFilter = query.filter;
      const messages = await searchMessages(searchQuery, searchFilter);
      const asteroids = await fetchAsteroids(); // Fetch asteroids data
      // const weatherData = await fetchAllWeatherData();

      res.render('pages/dashboard', { messages, asteroids, cards: data.cards, searchQuery, searchFilter });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
    }
  });


  // New route for API endpoint to fetch event data
  app.get('/api/events', async (req, res) => {
    try {
      const { query } = req;
      const searchQuery = query.search;
      const searchFilter = query.filter;
      const messages = await searchMessages(searchQuery, searchFilter);

      res.json(messages);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Route to render the /events view
  app.get('/events', async (req, res) => {
    try {
      const { query } = req;
      const searchQuery = query.search;
      const searchFilter = query.filter;
      const messages = await searchMessages(searchQuery, searchFilter);
      const asteroids = await fetchAsteroids();

      // Pass the messages and asteroids data to the view
      res.render('pages/events', { messages, asteroids, cards: data.cards, searchQuery, searchFilter });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.post('/events', async (req, res) => {
    try {

      const data = req.body;

      // Pass the messages and asteroids data to the view
      res.json(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
    }
  });


  // New route for API endpoint to fetch asteroids data for the graph
  app.get('/api/asteroids', async (req, res) => {
    try {
      const asteroids = await fetchAsteroids();
      // Extract the required data for the graph
      const asteroidsData = asteroids.map((asteroid) => ({
        date: asteroid.close_approach_data[0].close_approach_date_full,
        number: asteroid.estimated_diameter.meters.estimated_diameter_min,
      }));
      res.json(asteroidsData);
    } catch (error) {
      console.error('Error fetching asteroids:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Route to render the /asteroids view
  app.get('/asteroids', async (req, res) => {
    try {
      const { query } = req;
      const searchQuery = query.search;
      const searchFilter = query.filter;
      const asteroids = await fetchAsteroids(searchQuery, searchFilter);
      res.render('pages/asteroids', { asteroids, searchQuery, searchFilter });
    } catch (error) {
      console.error('Error fetching asteroids:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

  // weather messages
  app.get('/weather', async (req, res) => {
    try {
      const weatherData = await fetchAllWeatherData();
      res.render('pages/weather', { weatherData });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/sun', async (req, res) => {
    try {
      const sunData = await scrapeSunData();

      res.render('pages/sun', { sunData });
    } catch (error) {
      console.error('Error scraping Sun data:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // New route for API endpoint to fetch Sun Distribution data for the chart
  app.get('/api/sun', async (req, res) => {
    try {
      const sunData = await scrapegraphSun();
      res.json(sunData);
    } catch (error) {
      console.error('Error fetching Sun data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  const data = { cards: [ ], messages: []};

  
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

  const server = http.createServer(app);
  const io = socketIO(server);

  runConsumer().catch(console.error);

  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });



  