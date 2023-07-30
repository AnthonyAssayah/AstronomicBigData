const axios = require('axios');

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

module.exports = { fetchAsteroids };
