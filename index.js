const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const keys = require('./credentials.json');

const app = express();
app.use(cors());
app.use(express.json());

const sheets = google.sheets('v4');
const auth = new google.auth.GoogleAuth({
    credentials: keys,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = 'your-spreadsheet-id'; // Replace with your actual Google Sheets ID

// Save Score API Endpoint
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
        res.status(200).json({ message: 'Score saved successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving score', error: error.message });
    }
});

// Leaderboard API Endpoint
app.get('/leaderboard', async (req, res) => {
    try {
        const client = await auth.getClient();
        const response = await sheets.spreadsheets.values.get({
            auth: client,
            spreadsheetId: SPREADSHEET_ID,
            range: 'Leaderboard!A:B',
        });
        const rows = response.data.values || [];
        const leaderboard = rows.map(row => ({ name: row[0], score: row[1] }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        res.status(200).json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
