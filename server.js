  const express = require('express');
  const app = express();
  const socketIO = require('socket.io');
  const http = require('http');
  const axios = require('axios');
  const mongoose = require('mongoose');
  const { Kafka, Partitioners} = require("kafkajs");
  const { Client } = require('@elastic/elasticsearch');
  // const puppeteer = require('puppeteer');
  const puppeteer = require('puppeteer-core');
  const cheerio = require('cheerio');

  const port = 3001;

  // MongoDB configuration
  const apiKey = '81c957b66481bc5ead3f7eefe35842d8';
  const weatherURL = 'http://api.openweathermap.org/data/2.5/weather';

  mongoose.connect('mongodb+srv://AnthonyUser:Assayah19@sandbox.f4pnbch.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const weatherSchema = new mongoose.Schema({
    city: String,
    temperature: Number,
    description: String,
  });

  const Weather = mongoose.model('Weather', weatherSchema);

  // Elasticsearch configuration
  const bonsaiConfig = {
    node: 'http://localhost:9200',
  };
  

  const client = new Client(bonsaiConfig);
  const index = 'astronomic-index-new';


  app.use(express.static('public'));
  app.set('view engine', 'ejs');

 const data = {
    cards: [
      
    ],
    messages: []
  };

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
      console.log('Sun Data:', sunData); 

      res.render('pages/sun', { sunData });
    } catch (error) {
      console.error('Error scraping Sun data:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  

  async function scrapeSunData() {
    const baseUrl = 'https://theskylive.com';
    const url = `${baseUrl}/sun-info`;
  
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);

    const arr = [];
    $('.data').each(function(index, element) {
      arr.push($(element).text());
    });

    const table = arr.slice(6);

    const secondTable = table.map(item => {
      const [date, rightAscension, declination, magnitude, apparentDiameter, constellation] = item
        .trim()
        .split('\n')
        .filter(item => !/^\t+$/.test(item));

        return {
            date,
            rightAscension,
            declination,
            magnitude,
            apparentDiameter,
            constellation,
        };
    });

    // Function to remove all tabs from a string
    function removeTabsFromString(str) {
      return str.replace(/\t/g, '');
    }

    // Loop through each object in the array and remove tabs from all values
    for (const obj of secondTable) {
      for (const key in obj) {
        obj[key] = removeTabsFromString(obj[key]);
      }
    }


    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use the correct executable path
    });
  
    const page = await browser.newPage();
    await page.goto(url);
    
  
    // Wait for the page to load (you can adjust the wait time if needed)
    // await page.waitForTimeout(3000);
  
    // Scrape the data from the page
    const sunData = await page.evaluate((baseUrl) => {
      // Extract the data here based on the HTML structure of the Sun website
      const sunInfoElement = document.querySelector('#sun-info');
      const keyInfoBoxes = document.querySelectorAll('div.keyinfobox');
      const riseElement = document.querySelector('div.rise');
      const transitElement = document.querySelector('div.transit');
      const setElement = document.querySelector('div.set');

      console.log("riseElement: ", riseElement);
  
      // Extract the image URL of the Sun
      const imageElement = document.querySelector('.sun_container img');
      const imageUrl = imageElement ? imageElement.getAttribute('src') : null;
  
      // Ensure the image URL is a full URL
      const fullImageUrl = imageUrl ? new URL(imageUrl, baseUrl).href : null;
  
      // Extract the image URL of the sky map of the Sun
      const skyMapImageElement = document.querySelector('#skymap');
      const skyMapImageUrl = skyMapImageElement ? skyMapImageElement.getAttribute('src') : null;
  
      // Ensure the image URL is a full URL
      const fullSkyMapImageUrl = skyMapImageUrl ? new URL(skyMapImageUrl, baseUrl).href : null;
  
       // Extract the closest approach information
      const closestApproachElement = [...document.querySelectorAll('h1')].find(element => element.textContent.includes('Closest Approach of The Sun to Earth'));
      const closestApproachDescription = closestApproachElement ? closestApproachElement.nextElementSibling.textContent.trim() : 'No data available';

      const closestApproachDateElement = [...keyInfoBoxes].find(box => box.querySelector('label')?.textContent.includes('Date'));
      const closestApproachDistanceKmElement = [...keyInfoBoxes].find(box => box.querySelector('label')?.textContent.includes('Distance Kilometers'));
      const closestApproachDistanceAUElement = [...keyInfoBoxes].find(box => box.querySelector('label')?.textContent.includes('Distance AU'));
  
      const closestApproachDate = closestApproachDateElement ? closestApproachDateElement.querySelector('ar')?.textContent.trim() : 'No data available';
      const closestApproachDistanceKm = closestApproachDistanceKmElement ? closestApproachDistanceKmElement.querySelector('ar')?.textContent.trim() : 'No data available';
      const closestApproachDistanceAU = closestApproachDistanceAUElement ? closestApproachDistanceAUElement.querySelector('ar')?.textContent.trim() : 'No data available';
  
      // Find the elements with specific labels and extract their text content
      const distanceKilometersElement = [...keyInfoBoxes].find(box => box.querySelector('label')?.textContent.includes('Distance Kilometers'));
      const distanceAUElement = [...keyInfoBoxes].find(box => box.querySelector('label')?.textContent.includes('Distance AU'));
      const lightTravelTimeElement = [...keyInfoBoxes].find(box => box.querySelector('label')?.textContent.includes('Light Travel Time'));
  
      // Extract text content from the elements
      const sunInfo = sunInfoElement ? sunInfoElement.textContent.trim() : 'No data available';
      const distanceKilometers = distanceKilometersElement ? distanceKilometersElement.querySelector('ar')?.textContent.trim() : 'No data available';
      const distanceAU = distanceAUElement ? distanceAUElement.querySelector('ar')?.textContent.trim() : 'No data available';
      const lightTravelTime = lightTravelTimeElement ? lightTravelTimeElement.querySelector('ar')?.textContent.trim() : 'No data available';
      var rise = riseElement ? riseElement.textContent.trim() : 'No data available';
      var transit = transitElement ? transitElement.textContent.trim() : 'No data available';
      var set = setElement ? setElement.textContent.trim() : 'No data available';

      // Define regular expressions to match the patterns
      const riseazimuthRegex = /Azimuth:\s+([-+]?\d+\.\d+°)/;
      const riseTimeRegex = /RISE\s+(\d+:\d+)/;

      const transitazimuthRegex = /Max altitude:\s+([-+]?\d+\.\d+°)/;
      const transitTimeRegex = /TRANSIT\s+(\d+:\d+)/;

      const setazimuthRegex = /Azimuth:\s+([-+]?\d+\.\d+°)/;
      const setTimeRegex = /SET\s+(\d+:\d+)/;

      // Extract the azimuth and rise time using the regular expressions
      const riseAzimuthMatch = rise.match(riseazimuthRegex);
      const riseTimeMatch = rise.match(riseTimeRegex);

      // Check if matches were found and extract the values
      const riseAzimuthValue = riseAzimuthMatch ? riseAzimuthMatch[1] : null;
      const riseTimeValue = riseTimeMatch ? riseTimeMatch[1] : null;

      rise = [riseAzimuthValue, riseTimeValue]

      // Extract the azimuth and rise time using the regular expressions
      const transitAzimuthMatch = transit.match(transitazimuthRegex);
      const transitTimeMatch = transit.match(transitTimeRegex);

      // Check if matches were found and extract the values
      const transitazimuthValue = transitAzimuthMatch ? transitAzimuthMatch[1] : null;
      const transitTimeValue = transitTimeMatch ? transitTimeMatch[1] : null;

      console.log('Azimuth:', transitazimuthValue); // Output: Azimuth: 71.3
      console.log('Azimuth:', transitTimeValue); // Output: Azimuth: 71.3
      transit = [transitazimuthValue, transitTimeValue];

       // Extract the azimuth and rise time using the regular expressions
       const setAzimuthMatch = set.match(setTimeRegex);
       const setTimeMatch = set.match(setazimuthRegex);
 
       // Check if matches were found and extract the values
       const setAzimuthValue = setAzimuthMatch ? setAzimuthMatch[1] : null;
       const setTimeValue = setTimeMatch ? setTimeMatch[1] : null;
 
       set = [setAzimuthValue, setTimeValue]

      
      // Extract the physical data table
      const physicalDataElement = document.querySelector('table.objectdata');
      const physicalDataRows = physicalDataElement ? physicalDataElement.querySelectorAll('tr.data') : [];

      // Extract physical data from the rows
      const physicalData = {};
      physicalDataRows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const parameter = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();
          const relativeToEarth = cells[2].textContent.trim();
          physicalData[parameter] = {
            value: value,
            relativeToEarth: relativeToEarth,
          };
        }
      });

      
      // Return the scraped data as an object
      return {
        sunInfo,
        distanceKilometers,
        distanceAU,
        lightTravelTime,
        rise,
        transit,
        set,
        imageUrl: fullImageUrl,
        skyMapImageUrl: fullSkyMapImageUrl,
        closestApproachDescription,
        closestApproachDate,
        closestApproachDistanceKm,
        closestApproachDistanceAU,
        physicalData,
      };
    }, baseUrl);
  
    await browser.close();
    sunData['arrTable'] = secondTable;
    console.log("sunData: ", sunData)
    return sunData;
  }

  

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

  async function runConsumer() {
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

  async function fetchAsteroids(searchQuery, searchFilter) {
    const NASA_API_KEY = 'PkhF6B4cuH22gwSHKSmLWhbLxbVPXDDb2GuRoKeQ'; // Replace with your NASA API key
    const NASA_API_URL = 'https://api.nasa.gov/neo/rest/v1/feed';
  
    try {
      const response = await axios.get(NASA_API_URL, {
        params: {
          api_key: NASA_API_KEY,
        },
      });
  
      const asteroids = Object.values(response.data.near_earth_objects)
        .flat()
        .map((asteroid) => ({
          id: asteroid.id,
          name: asteroid.name,
          absolute_magnitude_h: asteroid.absolute_magnitude_h,
          estimated_diameter: asteroid.estimated_diameter,
          close_approach_data: asteroid.close_approach_data,
        }));
  
      // Filter asteroids based on the searchQuery and searchFilter
      const filteredAsteroids = asteroids.filter((asteroid) => {
        if (searchQuery && searchFilter) {
          // Perform case-insensitive search and filtering
          const queryValue = searchQuery.toLowerCase();
          const filterValue = asteroid[searchFilter]?.toLowerCase();
          return filterValue && filterValue.includes(queryValue);
        } else {
          return true; // Return all asteroids if no searchQuery and searchFilter provided
        }
      });
  
      return filteredAsteroids;
    } catch (error) {
      console.error('Error fetching asteroids:', error);
      throw error;
    }
  }
  

  async function getWeatherData(city) {
    try {
      const response = await axios.get(weatherURL, {
        params: {
          q: city,
          appid: apiKey,
          units: 'metric',
        },
      });

      const { name, main, weather } = response.data;
      return {
        city: name,
        temperature: main.temp,
        description: weather[0].description,
      };
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
      throw error;
    }
  }

  async function fetchAllWeatherData() {
    const cities = [
      'Paris', 'London', 'Tel Aviv', 'Madrid', 'Berlin',
      'Jerusalem', 'New York', 'Bogota', 'Lima', 'Mexico', 'Moscow', 'Tokyo'  ];

    try {
      const weatherData = await Promise.all(cities.map(city => getWeatherData(city)));
      await Promise.all(weatherData.map(data => {
        const weather = new Weather(data);
        return weather.save();
      }));
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  runConsumer().catch(console.error);


  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });



  