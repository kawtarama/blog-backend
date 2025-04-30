const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database/database');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
db.initialize();

// Simple route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Blog API' });
});

// Include post routes
require('./routes/post.routes')(app);

// Set port and listen for requests
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});