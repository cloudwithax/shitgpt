const express = require('express');
const path = require('path');

const app = express();

app.use(express.json())

require('dotenv').config();

const apiUrl = "https://api.clxud.dev/api/generate";

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res,) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/generate', async (req, res) => {
    const requestBody = req.body;

    // make post request to the API
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    // check if response is valid
    if (!response.body) {
        throw new Error('Response body not available');
    }

    const reader = response.body.getReader();

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        res.write(new TextDecoder().decode(value));
    }

    res.end();
});


// Start the server
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
