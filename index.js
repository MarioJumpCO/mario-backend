const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(cors());
app.use(bodyParser.json());

// Google Sheets setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const spreadsheetId = process.env.SHEET_ID || 'your-spreadsheet-id'; // Replace with your spreadsheet ID

// Load client secrets from the `credentials.json` file
const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8')); // Or use environment variables in production

// Authorize a client with credentials, then call the Google Sheets API
async function authorize() {
    const { client_email, private_key } = credentials;
    const auth = new google.auth.JWT(
        client_email,
        null,
        private_key.replace(/\\n/g, '\n'), // Handle the newline issue in private keys
        SCOPES
    );
    return auth;
}

// Save player score to Google Sheets
app.post('/saveScore', async (req, res) => {
    const { playerName, score } = req.body;
    
    try {
        const auth = await authorize();
        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:C', // Assuming columns A-C store playerName, score, and date
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[playerName, score, new Date().toISOString()]]
            }
        });

        res.status(200).send({ message: 'Score saved successfully' });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).send({ message: 'Failed to save score', error: error.message });
    }
});

// Retrieve top 5 scores from Google Sheets
app.get('/leaderboard', async (req, res) => {
    try {
        const auth = await authorize();
        const sheets = google.sheets({ version: 'v4', auth });

        const result = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:C' // Assuming columns A-C store playerName, score, and date
        });

        const rows = result.data.values || [];
        
        // Sort by score (column B), then return the top 5
        const sortedScores = rows
            .slice(1) // Skip the header row
            .sort((a, b) => b[1] - a[1]) // Sort by score
            .slice(0, 5); // Get the top 5 scores

        res.status(200).send(sortedScores);
    } catch (error) {
        console.error('Error retrieving leaderboard:', error);
        res.status(500).send({ message: 'Failed to retrieve leaderboard', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
