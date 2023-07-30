const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
const port = 3001;

const apiKey = '81c957b66481bc5ead3f7eefe35842d8';
const weatherURL = 'http://api.openweathermap.org/data/2.5/weather';

// MongoDB Atlas connection string
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

const cities = [
  'Paris',
  'London',
  'Tel Aviv',
  'Madrid',
  'Berlin',
  'Jerusalem',
  'New York',
  'Bogota',
  'Lima',
  'Mexico',
];

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
  const allWeatherData = [];
  for (const city of cities) {
    const weatherData = await getWeatherData(city);
    allWeatherData.push(weatherData);
    const weather = new Weather(weatherData);
    await weather.save();
  }
  return allWeatherData;
}

app.get('/weather', async (req, res) => {
  try {
    const weatherData = await fetchAllWeatherData();
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch weather data' });
  }
});

app.listen(port, () => {
  console.log(`Weather app listening on port ${port}`);
});

module.exports = { fetchAllWeatherData };
