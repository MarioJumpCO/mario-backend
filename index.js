const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const keys = require('./credentials.json');

const app = express();
const sheets = google.sheets('v4');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Authorize Google Sheets API
const auth = new google.auth.GoogleAuth({
    credentials: keys,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Google Sheets ID
const SPREADSHEET_ID = '1EZpvDxmT17YEx0lUXq_2vfLNvz03iDDkPnW3uWTxbkw';  // Replace with your Sheet ID

// API endpoint to save scores
app.post('/saveScore', async (req, res) => {
    const { playerName, score } = req.body;

    try {
        const client = await auth.getClient();
        await sheets.spreadsheets.values.append({
            auth: client,
            spreadsheetId: SPREADSHEET_ID,
            range: 'Leaderboard!A:B',
            valueInputOption: 'RAW',
            requestBody: {
                values: [[playerName, score]],
            },
        });
        // Send a successful JSON response
        res.status(200).json({ message: 'Score saved successfully!' });
    } catch (error) {
        console.error('Error saving score:', error);
        // Send an error JSON response
        res.status(500).json({ message: 'Error saving score', error: error.message });
    }
});

// API endpoint to get the leaderboard
app.get('/leaderboard', async (req, res) => {
    try {
        const client = await auth.getClient();
        const response = await sheets.spreadsheets.values.get({
            auth: client,
            spreadsheetId: SPREADSHEET_ID,
            range: 'Leaderboard!A:B',
        });

        const rows = response.data.values || [];
        const leaderboard = rows
            .map((row) => ({ name: row[0], score: row[1] }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        // Send the leaderboard data as JSON
        res.status(200).json(leaderboard);
    } catch (error) {
        console.error('Error retrieving leaderboard:', error);
        // Send an error JSON response
        res.status(500).json({ message: 'Error retrieving leaderboard', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
