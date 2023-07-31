# Astronomic Big Data

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [File Structure](#file-structure)
- [Architecture ](#architecture)

## Introduction

Astronomic Big Data is an project aiming on data transfer , web scrapping , UI 

## Features

- Data Collection: The project includes scripts and utilities to collect data from various astronomical sources, such as NASA api , and private databases.

- Data Processing: Astronomic Big Data offers data processing pipelines to clean, filter, and transform the collected raw data into a structured and usable format.

- Data Visualization: The project provides interactive visualizations to explore astronomical data and gain insights into celestial objects, events, and phenomena.

## Demo



- [Dashboard page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/8bad00a6-89ea-4561-ba7e-b9103303a194)
- [User profile page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/91e60e04-aba6-4dd5-b95a-0c821a82c6d8)
- [Events page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/566e1961-e8e2-4496-821e-426e12f44981)
- [Asteroids page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/0a9c2f75-2822-432b-9c23-75feb6999dde)
- [Sun page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/89431a96-b7f6-4d05-a892-6de0c6fbe590)
- [Weather page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/6ca92a4f-0743-41b8-baa5-66a6777c5769)


| Dashboard page | Events page | Asteroids page  |
| --- | --- | ---  |
| ![Dashboard page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/8bad00a6-89ea-4561-ba7e-b9103303a194)]  | ![Events page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/566e1961-e8e2-4496-821e-426e12f44981)| ![Asteroids page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/0a9c2f75-2822-432b-9c23-75feb6999dde)

| Dashboard page | Sun page | Weather page  |
| --- | --- | ---  |
| ![Dashboard page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/91e60e04-aba6-4dd5-b95a-0c821a82c6d8)| ![Sun page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/89431a96-b7f6-4d05-a892-6de0c6fbe590)  | ![Weather page](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92322613/6ca92a4f-0743-41b8-baa5-66a6777c5769)



## Installation

To use Astronomic Big Data, follow these installation steps:

1. Clone the repository:

   ```bash
    git clone -b master https://github.com/AnthonyAssayah/AstronomicBigData

2. Install all the required modules
    ```bash
   npm install

3. Build and run the docker-compose
   ```bash
   docker-compose -f elasticsearch-kibana-docker-compose.yml -d

4. Run the required js files
   ```
   node ./Client_ES.js
   node ./simulator.js
   node ./server.js
## File Structure

Within the download you'll find the following directories and files:

```
DASHBOARDWITHWS
  ├── node_modules
  ├── model
  |     ├── asteroids.js
  |     ├── events.js
  |     ├── sunScrapping.js
  |     └── weather.js   
  ├── public
  │   ├── css
  │   ├── fonts
  │   ├── images
  │   └── js
  ├── views
  │   ├── pages
  │   └── partials     
  ├── pages
  ├── docker-compose.yml
  ├── server.js
  ├── package.json
  └── package-lock.json
```
   
## Architecture 

![image](https://github.com/AnthonyAssayah/AstronomicBigData/assets/92504985/314135ae-4268-46d0-872c-d9624e044fd4)

