const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-core');

// Function to remove all tabs from a string
function removeTabsFromString(str) {
  return str.replace(/\t/g, '');
}

async function scrapegraphSun() {
  const baseUrl = 'https://theskylive.com';
  const url = `${baseUrl}/sun-info`;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const arr = [];
    $('.data').each(function (index, element) {
      arr.push($(element).text());
    });
    const table = arr.slice(6);
    const sunData = table.map(item => {
      const [date, , , , apparentDiameter, ,] = item
        .trim()
        .split('\n')
        .filter(item => !/^\t+$/.test(item));

      return {
        date: date.replace(/\t/g, ''),
        apparentDiameter: apparentDiameter.replace(/\t/g, ''),
      };
    });

    return sunData;
  } catch (error) {
    console.error('Error scraping Sun data:', error);
    throw error;
  }
}

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
    return sunData;
  }



// Export the functions so that other files can use them
module.exports = {
    scrapegraphSun,
    scrapeSunData,
  };