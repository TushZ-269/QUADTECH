// server.js
const express = require('express');
const fetch = require('node-fetch'); // To make HTTP requests from the server
const cors = require('cors'); // To allow our frontend to talk to this backend
require('dotenv').config(); // To load our secret API key from .env

const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Initialize Express App ---
const app = express();
const port = 3000;

// --- Use Middleware (MUST be after 'const app = express()') ---
app.use(cors()); // Use CORS for all routes
app.use(express.json()); // IMPORTANT: Allows server to read JSON from requests

// --- Initialize the Google AI client ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-pro" });


// --- UPDATED: /api/news route ---
app.get('/api/news', async (req, res) => {
    
    // Get the NEW secret key from the .env file
    const apiKey = process.env.NEWSDATA_API_KEY; 
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured. Check your .env file.' });
    }

    // This query searches for our keywords in news articles
    const query = '(Karnataka OR Maharashtra) AND (finance OR tax OR economy OR budget OR business)';
    
    // THIS IS THE CORRECTED LINE:
    // We use newsdata.io for this request, with *only* the "business" category
    const apiUrl = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en&category=business`;

    try {
        const newsResponse = await fetch(apiUrl);
        const newsData = await newsResponse.json();

        // --- ADAPT THE DATA ---
        // We now check if 'newsData.results' is *actually an array*.
        if (!Array.isArray(newsData.results)) {
             // This will now catch errors where 'results' is an object
            console.error("Error from newsdata.io (results was not an array):", newsData); 
            return res.status(500).json({ error: 'Failed to fetch news. The API returned an error.'});
        }

        // This code is now safe because we know newsData.results is an array.
        const adaptedArticles = newsData.results.map(article => {
            return {
                title: article.title,
                description: article.description,
                url: article.link,
                source: {
                    name: article.source_id || 'Unknown Source'
                },
                publishedAt: article.pubDate
            };
        });
        
        // Send the *adapted* data back to our frontend
        res.json({ articles: adaptedArticles });

    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news from source.' });
    }
});
// --- END OF UPDATED /api/news route ---


// --- NEW: /api/advice route ---
app.post('/api/advice', async (req, res) => {
    // Get the news and business data from the frontend
    const { newsArticles, businessData } = req.body;

    if (!newsArticles || !businessData) {
        return res.status(400).json({ error: 'Missing news or business data.' });
    }

    // --- 1. Create the Prompt ---
    const prompt = `
        You are an expert business advisor for a small business. 
        I will give you the latest financial news and my business performance data.
        Your job is to provide 3-5 short, actionable bullet points of advice.

        --- LATEST NEWS ---
        ${JSON.stringify(newsArticles, null, 2)}

        --- MY BUSINESS DATA (Last 30 Days) ---
        Total Revenue: ${businessData.totalRevenue.toFixed(2)}
        Total Expenditure: ${businessData.totalExpenditure.toFixed(2)}
        Net Profit: ${businessData.netProfit.toFixed(2)}
        Average Daily Revenue: ${businessData.avgRevenue.toFixed(2)}

        --- YOUR ADVICE ---
        Based on the news and my performance, what should I be cautious about or what opportunities should I look for?
    `;

    // --- 2. Ask the AI ---
    try {
        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        const adviceText = response.text();
        
        // Send the AI's advice back to the frontend
        res.json({ advice: adviceText });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: 'Failed to get AI advice.' });
    }
});
// --- END OF NEW /api/advice route ---


// --- This is the original app.listen code ---
app.listen(port, () => {
    console.log(`✅ News server listening at http://localhost:${port}`);
    console.log(`Your frontend can now fetch news from this server.`);
});