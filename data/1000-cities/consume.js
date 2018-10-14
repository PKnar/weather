const fs = require("fs");
const path = require("path");
const _ = require("underscore");
const folder = "./todo";

getMostRecentFile = dir => {
  let files = fs.readdirSync(dir);

  return _.max(files, f => {
    let fullpath = path.join(dir, f);

    return fs.statSync(fullpath).ctime;
  });
};

let latestFile = getMostRecentFile(folder);

let data = fs.readFileSync(path.join(folder, latestFile), "utf-8");
let dataOBJ = JSON.parse(data);

var mysql = require("mysql");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Data000",
  database: "1000_cities_weather"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  console.log("1000 records is to be inserted.");

  if (dataOBJ.length === 1000) {
    for (let i = 0; i < dataOBJ.length; i++) {
      const geohash3 = dataOBJ[i].weather[0].geohash3;
      const geohash5 = dataOBJ[i].weather[0].geohash5;
      const sourceApi = dataOBJ[i].weather[0].sourceApi;
      const lat = dataOBJ[i].location.latitude;
      const cityName = dataOBJ[i].location.city;
      const lng = dataOBJ[i].location.longitude;
      const altitude = dataOBJ[i].location.altitude;
      const fromHour = Date.parse(dataOBJ[i].weather[0].fromHour) / 1000;
      const symbol = dataOBJ[i].weather[0].symbol;
      const fogPercent = dataOBJ[i].weather[0].fogPercent;
      const pressureHPA = dataOBJ[i].weather[0].pressureHpa;
      const cloudinessPercent = dataOBJ[i].weather[0].cloudinessPercent;
      const windDirectionDeg = dataOBJ[i].weather[0].windDirectionDeg;
      const dewpointTemperatureC = dataOBJ[i].weather[0].dewpointTemperatureC;
      const humidityPercent = dataOBJ[i].weather[0].humidityPercent;
      const windSpeedMps = dataOBJ[i].weather[0].windSpeedMps;
      const temperatureC = dataOBJ[i].weather[0].temperatureC;
      const lowCloudsPercent = dataOBJ[i].weather[0].lowCloudsPercent;
      const mediumCloudsPercent = dataOBJ[i].weather[0].mediumCloudsPercent;
      const highCloudsPercent = dataOBJ[i].weather[0].highCloudsPercent;
      let values = [
        geohash3,
        geohash5,
        sourceApi,
        lat,
        lng,
        altitude,
        fromHour,
        symbol,
        fogPercent,
        pressureHPA,
        cloudinessPercent,
        windDirectionDeg,
        dewpointTemperatureC,
        humidityPercent,
        windSpeedMps,
        temperatureC,
        lowCloudsPercent,
        mediumCloudsPercent,
        highCloudsPercent
      ];
      var sql =
        "INSERT INTO weather(geohash3,geohash5,  sourceApi, lat, lng, altitude,fromHour,symbol,fogPercent,pressureHPA,cloudinessPercent,windDirectionDeg, dewpointTemperatureC,humidityPercent,windSpeedMps, temperatureC,lowCloudsPercent,mediumCloudsPercent,highCloudsPercent)  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      con.query(sql, values, (err, result) => {
        if (err) throw err;
        console.log(`Number of records inserted: ${i}  ${cityName}`);
      });
    }

    con.end();
  } else {
    console.log("Data is incomplete,Object length should be 1000.");
    con.end();
  }
});
