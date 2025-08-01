// server.js
// Use import syntax for node-fetch v3 and above
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch'; // Correct import for node-fetch v3+
import { fileURLToPath } from 'url'; // Required for __dirname equivalent in ESM

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// __filename and __dirname are not directly available in ES modules.
// This is how you get their equivalents:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// API endpoint for AI suggestions
app.post('/get-suggestions', async (req, res) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const { patientInfoPrompt } = req.body; // Get the prompt from the client

    if (!geminiApiKey) {
        console.error('GEMINI_API_KEY is not set in the .env file.');
        return res.status(500).json({ error: 'Server configuration error: Gemini API key missing.' });
    }

    // Construct the payload for the Gemini API
    const payload = {
        contents: [{ role: "user", parts: [{ text: patientInfoPrompt }] }],
        // Add generationConfig to specify a JSON response format
        generationConfig: {
            responseMimeType: "application/json",
        },
    };

    // The model is specified in the URL, so no need for the 'model' key in the payload.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', errorData);
            return res.status(response.status).json({
                error: `Gemini API error: ${response.statusText}`,
                details: errorData.error.message
            });
        }

        const result = await response.json();
        res.json(result); // Send the AI response back to the client

    } catch (error) {
        console.error('Error fetching from Gemini API:', error);
        res.status(500).json({ error: 'Failed to get suggestions from AI.', details: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
