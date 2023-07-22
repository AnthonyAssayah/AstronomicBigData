const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');
const { Client } = require('@elastic/elasticsearch');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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
  node: 'https://a308a0gamg:nqt2vxs23c@personal-search-9388846395.us-east-1.bonsaisearch.net:443',
  auth: {
    username: 'a308a0gamg',
    password: 'nqt2vxs23c',
  },
};

const client = new Client(bonsaiConfig);
const index = 'astronomic-index-new';

app.set('view engine', 'ejs');
app.use(express.static('public'));

// astronomic events messages
app.get('/', async (req, res) => {
  try {
    const { query } = req;
    const searchQuery = query.search;
    const searchFilter = query.filter;
    const messages = await searchMessages(searchQuery, searchFilter);
    const asteroids = await fetchAsteroids();

    res.render('index', { messages, asteroids });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// asteroids messages
app.get('/asteroids', async (req, res) => {
  try {
    const asteroids = await fetchAsteroids();
    res.render('asteroids', { asteroids });
  } catch (error) {
    console.error('Error fetching asteroids:', error);
    res.status(500).send('Internal Server Error');
  }
});


// weather messages
app.get('/weather', async (req, res) => {
  try {
    const weatherData = await fetchAllWeatherData();
    res.render('weather-cards', { weatherData });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).send('Internal Server Error');
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('newMessage', (message) => {
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
    sort: [{ time: { order: 'desc' } }],
    size: 10,
  };

  if (searchQuery && searchFilter) {
    searchBody = {
      query: {
        match_phrase: {
          [searchFilter]: searchQuery,
        },
      },
      sort: [{ time: { order: 'desc' } }],
      size: 10,
    };
  }

  const { body } = await client.search({
    index,
    body: searchBody,
  });

  const messages = body.hits.hits.map((hit) => hit._source);
  return messages;
}

async function fetchAsteroids() {
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

    return asteroids;
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
    'Jerusalem', 'New York', 'Bogota', 'Lima', 'Mexico'
  ];

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

const port = 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
