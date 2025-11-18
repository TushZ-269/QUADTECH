const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;
app.use(cors());

// Get API keys from .env file
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

// --- API Helper Functions ---

// 1. Finnhub: Get Company News
async function fetchCompanyNews(symbol) {
    // Get today's date and yesterday's date for the news query
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const url = `${FINNHUB_URL}/company-news?symbol=${symbol}&from=${yesterday}&to=${today}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch Finnhub news');
    return await response.json();
}

// 2. Finnhub: Get a Real-time Quote (Price)
async function fetchQuote(symbol) {
    const url = `${FINNHUB_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch Finnhub quote');
    return await response.json();
}

// 3. data.gov.in: Get Agricultural Data
async function fetchMandiData(commodity) {
    const resourceID = '9ef84268-d588-465a-a308-a864a43d0070';
    const url = `https://api.data.gov.in/resource/${resourceID}?api-key=${DATA_GOV_API_KEY}&format=json&filters[state]=Maharashtra&filters[commodity]=${commodity}&limit=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch Mandi data');
    return await response.json();
}

// --- Main API Endpoint ---
app.get('/api/data', async (req, res) => {
    const productName = req.query.product || '';
    
    // --- "AI" Mapping ---
    // This now maps your input to a real-world commodity or stock ticker
    let fetchType = 'none';
    let query = '';
    
    const pName = productName.toLowerCase();
    
    if (pName.includes('steel') || pName.includes('tata steel')) {
        fetchType = 'finnhub';
        query = 'TATASTEEL.NS'; // .NS is for National Stock Exchange (India)
    } else if (pName.includes('reliance')) {
        fetchType = 'finnhub';
        query = 'RELIANCE.NS';
    } else if (pName.includes('cotton')) {
        fetchType = 'mandi';
        query = 'Cotton';
    } else if (pName.includes('wheat')) {
        fetchType = 'mandi';
        query = 'Wheat';
    } else if (pName.includes('rice') || pName.includes('paddy')) {
        fetchType = 'mandi';
        query = 'Paddy';
    }

    try {
        let responseData = { type: fetchType, quote: null, news: null, commodity: null };

        if (fetchType === 'finnhub') {
            // Call Finnhub APIs
            const [quoteData, newsData] = await Promise.all([
                fetchQuote(query),
                fetchCompanyNews(query)
            ]);
            responseData.quote = quoteData;
            responseData.news = newsData; // Finnhub news is an array
            responseData.symbol = query; // Send the symbol back

        } else if (fetchType === 'mandi') {
            // Call Mandi API
            const commodityData = await fetchMandiData(query);
            responseData.commodity = commodityData;
        }

        res.json(responseData); // Send the structured data to the frontend

    } catch (error) {
        console.error('Error fetching data from backend:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`✅ Professional data server running at http://localhost:${port}`);
});