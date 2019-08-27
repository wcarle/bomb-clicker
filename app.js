'use strict';

const express = require('express');
const twig = require('twig');

const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index.twig');
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;