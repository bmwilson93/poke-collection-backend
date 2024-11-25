const express = require('express');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 4001;

app.get('/', (req, res) => {
  res.send("hi");
})

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
})