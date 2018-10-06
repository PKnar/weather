const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const requireDir = require("require-dir");
const dir = requireDir("./stats-folder");
app.get("/data", (req, res) => {
  res.send({ dir });
});
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
