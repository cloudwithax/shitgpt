const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS


// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
});

// Serve index.html for all routes
app.get('*', (req, res,) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
