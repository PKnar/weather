const curl = require("curl");
const jsdom = require("jsdom");
const fs = require("fs");
const { JSDOM } = jsdom;
const convert = require("xml-js");
const request = require("sync-request");
const sleep = require("system-sleep");

const url = "https://www.latlong.net/category/cities-235-15.html";

writeFile = (path, data) => {
  return fs.writeFile(path, JSON.stringify(data, null, 2), err => {
    if (err) {
      console.log(err);
    }
  });
};

curl.get(url, (err, resp, body) => {
  console.log("Requesting long/lat data");
  if (resp.statusCode === 200) {
    parseData(body);
  } else if (err) {
    console.log("Error while fetching");
  }
});
const locationAndWeather = [];
const ukCities = [];

parseData = html => {
  const dom = new JSDOM(html);
  const $ = require("jquery")(dom.window);
  const items = $("tr");

  for (let i = 1; i < items.length; i++) {
    const td = $(items[i]).find("td");
    const cityName = $($(td).find("a"))
      .text()
      .replace(/,/g, "")
      .split(" ")[0];
    const longitude = $($(td)[1]).html();
    const latitude = $($(td)[2]).html();

    let xml = request(
      "GET",
      `https://api.met.no/weatherapi/locationforecast/1.9/?lat=${latitude}&lon=${longitude}`
    );

    let xmlBody = xml.body;

    let metNoAPIData = convert.xml2json(xmlBody, { compact: true, spaces: 2 });
    let metNoObj = JSON.parse(metNoAPIData);

    let metNoJSON = metNoObj.weatherdata.product.time[0].location;

    let metNoDate = metNoObj.weatherdata.product.time[0]._attributes.from;
    let metNoLong = metNoJSON._attributes.longitude;
    let metNoLat = metNoJSON._attributes.latitude;
    let metNoTempC = parseInt(metNoJSON.temperature._attributes.value);
    writeFile("metNoData.json", metNoObj);

    //requesting weather information of each city

    curl.get(
      `https://www.timeanddate.com/weather/uk/${cityName}`,
      (err, resp, body) => {
        console.log(`Requesting weather data in ${cityName}`);
        if (resp.statusCode === 200) {
          const dom = new JSDOM(body);
          const $ = require("jquery")(dom.window);
          const divItems = $("#qlook").children();
          const temperatureData = $($(divItems)[2])
            .html()
            .replace(/&nbsp;/g, "");
          const temperature = parseInt(temperatureData);
          const description = $($(divItems)[3]).html();
          const details = $("#qfacts").children();
          const latestReport = $($(details)[2])
            .text()
            .replace(/Latest Report:/g, "")
            .trim();

          const pressureData = $($(details)[5])
            .text()
            .split(" ")[2];
          const pressure = parseInt(pressureData);
          const humidityData = $($(details)[6])
            .text()
            .split(" ")[2];
          const humidity = parseInt(humidityData);
          const tempDetails = $($(divItems)[5])
            .text()
            .split(" ");
          const feelsLikeData = $($(tempDetails))[2].slice(0, 2);
          const feelsLike = parseInt(feelsLikeData);
          const windData = $($(tempDetails))[6];
          const wind = parseInt(windData);
          //Full data object
          const obj = {
            location: {
              City: cityName,
              Longitude: longitude,
              Latitude: latitude
            },
            weather: [
              {
                city: cityName,
                dateTime: new Date().toLocaleString(),
                temperatureC: temperature,
                feelsLikeC: feelsLike,
                description,
                pressureMBAR: pressure,
                humidityPercent: humidity,
                windKmh: wind,
                latestReport
              }
            ],
            metNoAPIData: {
              metNoDate,
              metNoLong,
              metNoLat,
              metNoTempC
            }
          };
          locationAndWeather.push(obj);
          ukCities.push(cityName);
          // console.log(JSON.stringify(locationAndWeather, null, 2));
          //saving full information in JSON file
          writeFile("Weather-Output.json", locationAndWeather);

          //saving UK cities in JSON file
          writeFile("ukCities.json", ukCities);
        } else if (err) {
          console.log("Error while fetching");
        }
      }
    );
    sleep(2000);
  }
};

//write stats file after all requests are done
organizeStats = () => {
  const data = require("./Weather-Output.json");
  const cities = require("./ukCities.json");
  const date = Math.round(new Date().getTime() / 1000);

  let metNoTempC = data.map(data => parseInt(data.metNoAPIData.metNoTempC));

  let tempData = data.map(data => {
    return parseInt(data.weather.map(temp => temp.temperatureC));
  });
  let windData = data.map(data => {
    return parseInt(data.weather.map(temp => temp.windKmh));
  });

  let pressureData = data.map(data => {
    return parseInt(data.weather.map(temp => temp.pressureMBAR));
  });

  let forecastDate = data[0].weather[0].dateTime;
  let latestReport = data[0].weather[0].latestReport;

  const reducer = (accumulator, currentValue) => accumulator + currentValue;
  let sumOfTemp = tempData.reduce(reducer);
  let sumOfWind = windData.reduce(reducer);
  let sumOfPressure = pressureData.reduce(reducer);
  let sumOfMetNoTemp = metNoTempC.reduce(reducer);
  let temperatureDifference = sumOfMetNoTemp - sumOfTemp;

  let stats = {
    timeStampRun: date,
    forecastDate,
    longLatApi: "https://www.latlong.net/category/cities-235-15.html",
    weatherApi: "https://www.timeanddate.com/weather/uk/" + "name of city",
    metNoAPI: "https://api.met.no",
    countOfCities: cities.length,
    countOfItems: cities.length * 1,
    sumOfTemp,
    sumOfWind,
    sumOfPressure,
    latestReport,
    temperatureDifference
  };

  writeFile(`./stats-folder/stats-${date}.json`, stats);
};
setTimeout(organizeStats, 60 * 3000);
