let fs = require("fs");
let data = require("./metNoWeatherOutput.json");
let timestamp = Math.round(new Date().getTime() / 1000);

fs.writeFileSync(
  `./todo/api.met.no.${timestamp}.json`,
  JSON.stringify(data, null, 2)
);
