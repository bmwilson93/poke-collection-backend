const express = require('express');
const app = express();

const PORT = 4001;

app.get('/', (req, res) => {
  res.send("hi");
})

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
})